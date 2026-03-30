import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  const search = request.nextUrl.searchParams.get("search");

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(date ? { bookingDate: new Date(date) } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search } } },
              { car: { licensePlate: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      car: true,
      employee: true,
      bookingServices: {
        include: {
          service: true,
        },
      },
    },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json(bookings);
}
