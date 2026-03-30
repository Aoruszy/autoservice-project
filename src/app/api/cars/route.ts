import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { carSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const cars = await prisma.car.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cars);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = carSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const car = await prisma.car.create({
    data: {
      ...parsed.data,
      vin: parsed.data.vin || null,
      userId: auth.user.id,
    },
  });

  return NextResponse.json(car, { status: 201 });
}
