import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import {
  assignEmployeeForSlot,
  createNotification,
} from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { dateOnly, minutesToTime, timeToMinutes } from "@/lib/utils";
import { bookingRescheduleSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = bookingRescheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingServices: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const serviceIds = booking.bookingServices.map((item) => item.serviceId);

  try {
    const employeeId = await assignEmployeeForSlot(
      parsed.data.date,
      parsed.data.time,
      serviceIds,
      booking.id,
    );
    const endTime = minutesToTime(
      timeToMinutes(parsed.data.time) + booking.totalDuration,
    );

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: {
          employeeId,
          bookingDate: dateOnly(parsed.data.date),
          startTime: parsed.data.time,
          endTime,
          status: BookingStatus.RESCHEDULED,
        },
      });

      await createNotification(
        booking.userId,
        "booking_rescheduled",
        `Запись перенесена на ${parsed.data.date} в ${parsed.data.time}.`,
        booking.id,
        tx,
      );

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось перенести запись",
      },
      { status: 400 },
    );
  }
}
