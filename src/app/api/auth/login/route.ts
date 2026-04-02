import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
  verifyPasswordAgainstDummyHash,
} from "@/lib/auth";
import { createAuditLog } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByRequest(request, {
    action: "auth:login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "auth.login.rate_limited",
      request,
      level: "warn",
    });

    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много попыток входа. Попробуйте чуть позже.",
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    await createAuditLog({
      action: "auth.login.validation_failed",
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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  const isValid = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : await verifyPasswordAgainstDummyHash(parsed.data.password);

  if (!user || !isValid) {
    await createAuditLog({
      action: "auth.login.failed",
      request,
      level: "warn",
      metadata: {
        email: parsed.data.email,
      },
    });

    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 },
      ),
      rateLimit,
    );
  }

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
    action: "auth.login.succeeded",
    request,
    userId: user.id,
  });

  return response;
}
