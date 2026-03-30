import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import {
  assignEmployeeForSlot,
  calculateBookingTotals,
  createNotification,
} from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { minutesToTime, timeToMinutes, dateOnly } from "@/lib/utils";
import { bookingCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = bookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const car = await prisma.car.findFirst({
    where: {
      id: parsed.data.carId,
      userId: auth.user.id,
    },
  });

  if (!car) {
    return NextResponse.json(
      { error: "Автомобиль не найден в вашем профиле" },
      { status: 404 },
    );
  }

  try {
    const totals = await calculateBookingTotals(parsed.data.serviceIds);
    const employeeId = await assignEmployeeForSlot(
      parsed.data.date,
      parsed.data.time,
      parsed.data.serviceIds,
    );
    const endTime = minutesToTime(
      timeToMinutes(parsed.data.time) + totals.totalDuration,
    );
    const bookingDate = dateOnly(parsed.data.date);

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId: auth.user.id,
          carId: parsed.data.carId,
          employeeId,
          bookingDate,
          startTime: parsed.data.time,
          endTime,
          totalPrice: totals.totalPrice,
          totalDuration: totals.totalDuration,
          status: BookingStatus.NEW,
          comment: parsed.data.comment || null,
          bookingServices: {
            create: totals.services.map((service) => ({
              serviceId: service.id,
              price: service.price,
              durationMinutes: service.durationMinutes,
            })),
          },
        },
        include: {
          bookingServices: {
            include: {
              service: true,
            },
          },
          car: true,
          employee: true,
        },
      });

      await createNotification(
        auth.user.id,
        "booking_created",
        `Запись создана на ${parsed.data.date} в ${parsed.data.time}.`,
        created.id,
        tx,
      );

      const admins = await tx.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification(
          admin.id,
          "new_booking",
          `Новая запись клиента ${auth.user.name} ожидает подтверждения.`,
          created.id,
          tx,
        );
      }

      return created;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать запись" },
      { status: 400 },
    );
  }
}
