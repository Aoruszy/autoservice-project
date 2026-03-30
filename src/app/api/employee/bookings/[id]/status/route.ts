import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import { createNotification } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { bookingStatusSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

const allowedStatuses: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
];

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["EMPLOYEE"]);
  if (auth.error) return auth.error;

  if (!auth.user.employee) {
    return NextResponse.json(
      { error: "Для пользователя не найден профиль мастера" },
      { status: 404 },
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = bookingStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  if (!allowedStatuses.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: "Мастер не может установить этот статус" },
      { status: 403 },
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      employeeId: auth.user.employee.id,
    },
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
      "employee_status_changed",
      `Мастер обновил статус работ: ${parsed.data.status}.`,
      booking.id,
      tx,
    );

    return result;
  });

  return NextResponse.json(updated);
}
