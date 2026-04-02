import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByRequest(request, {
    action: "auth:register",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "auth.register.rate_limited",
      request,
      level: "warn",
    });

    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много регистраций. Попробуйте позже.",
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    await createAuditLog({
      action: "auth.register.validation_failed",
      request,
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

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    await createAuditLog({
      action: "auth.register.duplicate_email",
      request,
      level: "warn",
      metadata: {
        email: parsed.data.email,
      },
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 },
      ),
      rateLimit,
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CLIENT",
    },
  });

  const token = await createSessionToken({ userId: user.id, role: user.role });
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
  setSessionCookie(response, token);
  applyRateLimitHeaders(response, rateLimit);

  await createAuditLog({
    action: "auth.register.succeeded",
    request,
    userId: user.id,
  });

  return response;
}
