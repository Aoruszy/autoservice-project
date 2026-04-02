import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import {
  assignEmployeeForSlot,
  calculateBookingTotals,
  createNotification,
} from "@/lib/booking";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { minutesToTime, timeToMinutes, dateOnly } from "@/lib/utils";
import { bookingCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const rateLimit = await rateLimitByRequest(request, {
    action: "booking:create",
    keyParts: [auth.user.id],
    limit: 10,
    windowMs: 30 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "booking.create.rate_limited",
      request,
      userId: auth.user.id,
      level: "warn",
    });

    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много попыток записи. Попробуйте позже.",
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    await createAuditLog({
      action: "booking.create.validation_failed",
      request,
      userId: auth.user.id,
      level: "warn",
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректные данные" },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const car = await prisma.car.findFirst({
    where: {
      id: parsed.data.carId,
      userId: auth.user.id,
    },
  });

  if (!car) {
    await createAuditLog({
      action: "booking.create.car_not_found",
      request,
      userId: auth.user.id,
      level: "warn",
      metadata: {
        carId: parsed.data.carId,
      } as Prisma.InputJsonValue,
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Автомобиль не найден в вашем профиле" },
        { status: 404 },
      ),
      rateLimit,
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

      await createAuditLog(
        {
          action: "booking.created",
          request,
          userId: auth.user.id,
          metadata: {
            bookingId: created.id,
            employeeId,
            totalPrice: totals.totalPrice,
            totalDuration: totals.totalDuration,
          } as Prisma.InputJsonValue,
        },
        tx,
      );

      return created;
    });

    return applyRateLimitHeaders(
      NextResponse.json(booking, { status: 201 }),
      rateLimit,
    );
  } catch (error) {
    await createAuditLog({
      action: "booking.create.failed",
      request,
      userId: auth.user.id,
      level: "error",
      metadata: {
        message: error instanceof Error ? error.message : "unknown_error",
      } as Prisma.InputJsonValue,
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Не удалось создать запись" },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
