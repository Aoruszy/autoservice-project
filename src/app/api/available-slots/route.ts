import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  rateLimitByRequest,
} from "@/lib/security";
import { availableSlotsQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const rateLimit = await rateLimitByRequest(request, {
    action: "booking:available_slots",
    limit: 90,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Слишком много запросов к расписанию. Попробуйте чуть позже.",
    );
  }

  const parsed = availableSlotsQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    serviceIds:
      request.nextUrl.searchParams
        .get("serviceIds")
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
  });

  if (!parsed.success) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректные данные" },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  try {
    const data = await getAvailableSlots(parsed.data);
    return applyRateLimitHeaders(NextResponse.json(data), rateLimit);
  } catch (error) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Ошибка расчета слотов" },
        { status: 400 },
      ),
      rateLimit,
    );
  }
}
