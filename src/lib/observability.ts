import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, getUserAgent } from "@/lib/security";

type RequestLike = {
  headers: Headers;
  method?: string;
  nextUrl?: { pathname: string };
  url?: string;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

type AuditLogInput = {
  action: string;
  request?: RequestLike;
  userId?: string | null;
  level?: "info" | "warn" | "error";
  route?: string;
  method?: string;
  metadata?: Prisma.InputJsonValue;
};

type AnalyticsEventInput = {
  type: string;
  path: string;
  request?: RequestLike;
  userId?: string | null;
  sessionId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

function resolveRoute(request?: RequestLike) {
  if (!request) {
    return null;
  }

  return request.nextUrl?.pathname || (request.url ? new URL(request.url).pathname : null);
}

export async function createAuditLog(
  input: AuditLogInput,
  db: DbClient = prisma,
) {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        level: input.level || "info",
        route: input.route || resolveRoute(input.request),
        method: input.method || input.request?.method || null,
        ip: input.request ? getClientIp(input.request) : null,
        userAgent: input.request ? getUserAgent(input.request) : null,
        userId: input.userId || null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("audit_log_failed", error);
  }
}

export async function trackAnalyticsEvent(
  input: AnalyticsEventInput,
  db: DbClient = prisma,
) {
  try {
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        path: input.path,
        ip: input.request ? getClientIp(input.request) : null,
        userAgent: input.request ? getUserAgent(input.request) : null,
        sessionId: input.sessionId || null,
        userId: input.userId || null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("analytics_event_failed", error);
  }
}
