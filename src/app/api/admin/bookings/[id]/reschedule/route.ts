import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import {
  assignEmployeeForSlot,
  createNotification,
} from "@/lib/booking";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { dateOnly, minutesToTime, timeToMinutes } from "@/lib/utils";
import { bookingRescheduleSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const rateLimit = await rateLimitByRequest(request, {
    action: "admin:booking_reschedule",
    keyParts: [auth.user.id],
    limit: 60,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "admin.booking_reschedule.rate_limited",
      request,
      userId: auth.user.id,
      level: "warn",
    });

    return createRateLimitErrorResponse(rateLimit);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bookingRescheduleSchema.safeParse(body);

  if (!parsed.success) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректные данные" },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingServices: true,
    },
  });

  if (!booking) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Запись не найдена" }, { status: 404 }),
      rateLimit,
    );
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

      await createAuditLog(
        {
          action: "admin.booking_rescheduled",
          request,
          userId: auth.user.id,
          metadata: {
            bookingId: booking.id,
            employeeId,
            date: parsed.data.date,
            time: parsed.data.time,
          } as Prisma.InputJsonValue,
        },
        tx,
      );

      return result;
    });

    return applyRateLimitHeaders(NextResponse.json(updated), rateLimit);
  } catch (error) {
    await createAuditLog({
      action: "admin.booking_reschedule.failed",
      request,
      userId: auth.user.id,
      level: "error",
      metadata: {
        bookingId: id,
        message: error instanceof Error ? error.message : "unknown_error",
      } as Prisma.InputJsonValue,
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Не удалось перенести запись",
        },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
