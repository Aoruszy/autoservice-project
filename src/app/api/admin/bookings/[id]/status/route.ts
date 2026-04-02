import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import { createNotification } from "@/lib/booking";
import { getStatusLabel } from "@/lib/constants";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { bookingStatusSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const rateLimit = await rateLimitByRequest(request, {
    action: "admin:booking_status",
    keyParts: [auth.user.id],
    limit: 90,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "admin.booking_status.rate_limited",
      request,
      userId: auth.user.id,
      level: "warn",
    });

    return createRateLimitErrorResponse(rateLimit);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bookingStatusSchema.safeParse(body);

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
  });

  if (!booking) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Запись не найдена" }, { status: 404 }),
      rateLimit,
    );
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
      `Статус вашей заявки изменен: ${getStatusLabel(parsed.data.status)}.`,
      booking.id,
      tx,
    );

    await createAuditLog(
      {
        action: "admin.booking_status.updated",
        request,
        userId: auth.user.id,
        metadata: {
          bookingId: booking.id,
          status: parsed.data.status,
          comment: parsed.data.comment || null,
        } as Prisma.InputJsonValue,
      },
      tx,
    );

    return result;
  });

  return applyRateLimitHeaders(NextResponse.json(updated), rateLimit);
}
