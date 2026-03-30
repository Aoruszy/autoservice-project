import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { createNotification } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { bookingStatusSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = bookingStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: {
        status: parsed.data.status,
        comment: [booking.comment, parsed.data.comment].filter(Boolean).join("\n"),
      },
    });

    await createNotification(
      booking.userId,
      "status_changed",
      `Статус вашей заявки изменен: ${parsed.data.status}.`,
      booking.id,
      tx,
    );

    return result;
  });

  return NextResponse.json(updated);
}
