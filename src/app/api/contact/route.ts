import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  detectSpamSignals,
  getClientIp,
  getSubmitDelayMs,
  getUserAgent,
  rateLimitByRequest,
} from "@/lib/security";
import { contactLeadSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const rateLimit = await rateLimitByRequest(request, {
    action: "contact:create",
    keyParts: [session?.userId],
    limit: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "contact.rate_limited",
      request,
      userId: session?.userId,
      level: "warn",
    });

    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много обращений. Попробуйте еще раз чуть позже.",
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = contactLeadSchema.safeParse(body);

  if (!parsed.success) {
    await createAuditLog({
      action: "contact.validation_failed",
      request,
      userId: session?.userId,
      level: "warn",
      metadata: {
        issue: parsed.error.issues[0]?.message || "invalid_contact_payload",
      } as Prisma.InputJsonValue,
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Некорректные данные формы",
        },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  const submitDelayMs = getSubmitDelayMs(parsed.data.submittedAt);
  const spamCheck = detectSpamSignals({
    honeypot: parsed.data.honeypot,
    submitDelayMs,
    message: parsed.data.message,
  });

  await prisma.contactLead.create({
    data: {
      name: parsed.data.name,
      contact: parsed.data.contact,
      message: parsed.data.message,
      honeypot: parsed.data.honeypot || null,
      sourcePage: parsed.data.sourcePage,
      clientIp: getClientIp(request),
      userAgent: getUserAgent(request),
      submitDelayMs,
      status: spamCheck.isSpam ? "SPAM" : "NEW",
      userId: session?.userId || null,
    },
  });

  await createAuditLog({
    action: spamCheck.isSpam ? "contact.spam_detected" : "contact.created",
    request,
    userId: session?.userId,
    level: spamCheck.isSpam ? "warn" : "info",
    metadata: {
      sourcePage: parsed.data.sourcePage,
      submitDelayMs,
      reasons: spamCheck.reasons,
    } as Prisma.InputJsonValue,
  });

  if (spamCheck.isSpam) {
    return applyRateLimitHeaders(new NextResponse(null, { status: 202 }), rateLimit);
  }

  return applyRateLimitHeaders(
    NextResponse.json(
      {
        message: "Спасибо! Мы свяжемся с вами в рабочее время.",
      },
      { status: 201 },
    ),
    rateLimit,
  );
}
