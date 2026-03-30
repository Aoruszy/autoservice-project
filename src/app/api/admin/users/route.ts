import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      cars: true,
      bookings: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
