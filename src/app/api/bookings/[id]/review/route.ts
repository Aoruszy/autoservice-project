import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/api";
import { createNotification } from "@/lib/booking";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { bookingReviewSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const rateLimit = await rateLimitByRequest(request, {
    action: "booking:review",
    keyParts: [auth.user.id],
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много попыток отправить отзыв. Попробуйте позже.",
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bookingReviewSchema.safeParse(body);

  if (!parsed.success) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректные данные" },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: auth.user.id,
      status: "COMPLETED",
    },
    include: {
      review: true,
    },
  });

  if (!booking) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Отзыв можно оставить только после завершенной работы" },
        { status: 404 },
      ),
      rateLimit,
    );
  }

  if (booking.review) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Отзыв по этой записи уже оставлен" },
        { status: 409 },
      ),
      rateLimit,
    );
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.bookingReview.create({
      data: {
        bookingId: booking.id,
        userId: auth.user.id,
        carId: booking.carId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    });

    const admins = await tx.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification(
        admin.id,
        "new_review",
        `Клиент оставил отзыв на ${parsed.data.rating}/5 по завершенной записи.`,
        booking.id,
        tx,
      );
    }

    await createAuditLog(
      {
        action: "booking.review_created",
        request,
        userId: auth.user.id,
        metadata: {
          bookingId: booking.id,
          rating: parsed.data.rating,
        } as Prisma.InputJsonValue,
      },
      tx,
    );

    return created;
  });

  return applyRateLimitHeaders(NextResponse.json(review, { status: 201 }), rateLimit);
}
