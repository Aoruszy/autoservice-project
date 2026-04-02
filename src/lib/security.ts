import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

type RequestLike = {
  headers: Headers;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  total: number;
};

export function getClientIp(request: RequestLike) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function getUserAgent(request: RequestLike) {
  return request.headers.get("user-agent")?.slice(0, 512) || null;
}

export function hashIdentifier(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function consumeRateLimit({
  action,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase() || "anonymous";
  const identifierHash = hashIdentifier(normalizedIdentifier);
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const key = `${action}:${identifierHash}:${windowStartMs}`;

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      key,
      action,
      identifier: identifierHash,
      windowStart,
      count: 1,
    },
    select: {
      count: true,
    },
  });

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + windowMs - now) / 1000),
  );

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
    total: bucket.count,
  };
}

export async function rateLimitByRequest(
  request: RequestLike,
  options: Omit<RateLimitOptions, "identifier"> & { keyParts?: Array<string | null | undefined> },
) {
  const parts = [getClientIp(request), ...(options.keyParts || [])]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  return consumeRateLimit({
    action: options.action,
    identifier: parts.join(":"),
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}

export function createRateLimitErrorResponse(
  result: RateLimitResult,
  message = "Слишком много запросов. Попробуйте чуть позже.",
) {
  const response = NextResponse.json({ error: message }, { status: 429 });
  return applyRateLimitHeaders(response, result);
}

export function getSubmitDelayMs(submittedAt: number) {
  return Math.max(0, Date.now() - submittedAt);
}

export function detectSpamSignals(input: {
  honeypot?: string;
  submitDelayMs?: number;
  message?: string;
}) {
  const reasons: string[] = [];

  if (input.honeypot?.trim()) {
    reasons.push("honeypot");
  }

  if (typeof input.submitDelayMs === "number" && input.submitDelayMs < 1500) {
    reasons.push("submitted_too_fast");
  }

  if (
    input.message &&
    /(https?:\/\/|www\.)/i.test(input.message) &&
    input.message.length < 40
  ) {
    reasons.push("suspicious_link_message");
  }

  return {
    isSpam: reasons.length > 0,
    reasons,
  };
}
