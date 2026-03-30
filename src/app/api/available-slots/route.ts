import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const serviceIds = request.nextUrl.searchParams
    .get("serviceIds")
    ?.split(",")
    .filter(Boolean);

  if (!date || !serviceIds?.length) {
    return NextResponse.json(
      { error: "Нужно передать дату и список услуг" },
      { status: 400 },
    );
  }

  try {
    const data = await getAvailableSlots({ date, serviceIds });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка расчета слотов" },
      { status: 400 },
    );
  }
}
