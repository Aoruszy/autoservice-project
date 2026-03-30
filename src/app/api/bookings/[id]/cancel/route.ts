import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import { createNotification, statusAllowsCancellation } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { cancelBookingSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = cancelBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: auth.user.id,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  if (!statusAllowsCancellation(booking.status)) {
    return NextResponse.json(
      { error: "Эту запись уже нельзя отменить" },
      { status: 409 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED_BY_CLIENT,
        comment: [booking.comment, parsed.data.reason].filter(Boolean).join("\n"),
      },
    });

    await createNotification(
      auth.user.id,
      "booking_cancelled",
      "Вы отменили запись. Слот снова доступен для бронирования.",
      id,
      tx,
    );

    const admins = await tx.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification(
        admin.id,
        "booking_cancelled",
        `Клиент ${auth.user.name} отменил запись.`,
        id,
        tx,
      );
    }

    return result;
  });

  return NextResponse.json(updated);
}
