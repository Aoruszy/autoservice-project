import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/observability";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { analyticsEventSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const rateLimit = await rateLimitByRequest(request, {
    action: "analytics:event",
    keyParts: [session?.userId],
    limit: 240,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много событий аналитики за короткое время.",
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return applyRateLimitHeaders(new NextResponse(null, { status: 204 }), rateLimit);
  }

  await trackAnalyticsEvent({
    type: parsed.data.type,
    path: parsed.data.path,
    request,
    sessionId: parsed.data.sessionId,
    userId: session?.userId,
    metadata: parsed.data.referrer
      ? ({ referrer: parsed.data.referrer } as Prisma.InputJsonValue)
      : undefined,
  });

  return applyRateLimitHeaders(new NextResponse(null, { status: 204 }), rateLimit);
}
