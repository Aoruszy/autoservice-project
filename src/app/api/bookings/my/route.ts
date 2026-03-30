import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const bookings = await prisma.booking.findMany({
    where: { userId: auth.user.id },
    include: {
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
