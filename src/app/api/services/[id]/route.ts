import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  return NextResponse.json(service);
}
