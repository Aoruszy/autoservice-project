import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["EMPLOYEE"]);
  if (auth.error) return auth.error;

  if (!auth.user.employee) {
    return NextResponse.json(
      { error: "Для пользователя не найден профиль мастера" },
      { status: 404 },
    );
  }

  const bookings = await prisma.booking.findMany({
    where: {
      employeeId: auth.user.employee.id,
    },
    include: {
      user: true,
      car: true,
      bookingServices: {
        include: {
          service: true,
        },
      },
    },
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(bookings);
}
