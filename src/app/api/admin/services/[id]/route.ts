import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const service = await prisma.service.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(service);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await params;

  const hasBookings = await prisma.bookingService.findFirst({
    where: { serviceId: id },
  });

  if (hasBookings) {
    const updated = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      ok: true,
      archived: true,
      service: updated,
    });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
