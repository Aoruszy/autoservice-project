import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request, ["ADMIN"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const service = await prisma.service.create({
    data: parsed.data,
  });

  return NextResponse.json(service, { status: 201 });
}
