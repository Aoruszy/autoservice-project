import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { carSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const existing = await prisma.car.findFirst({
    where: { id, userId: auth.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = carSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const car = await prisma.car.update({
    where: { id },
    data: {
      ...parsed.data,
      vin: parsed.data.vin || null,
    },
  });

  return NextResponse.json(car);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const existing = await prisma.car.findFirst({
    where: { id, userId: auth.user.id },
    include: {
      bookings: {
        where: {
          status: {
            in: ["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"],
          },
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
  }

  if (existing.bookings.length) {
    return NextResponse.json(
      { error: "Нельзя удалить автомобиль с активными записями" },
      { status: 409 },
    );
  }

  await prisma.car.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
