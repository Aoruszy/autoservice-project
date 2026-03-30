import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const employees = await prisma.employee.findMany({
    include: {
      user: true,
      bookings: {
        where: {
          status: {
            in: ["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"],
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}
