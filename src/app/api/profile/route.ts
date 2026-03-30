import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(request, ["CLIENT"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const emailOwner = await prisma.user.findFirst({
    where: {
      email: parsed.data.email.toLowerCase(),
      id: { not: auth.user.id },
    },
  });

  if (emailOwner) {
    return NextResponse.json(
      { error: "Этот email уже используется" },
      { status: 409 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
  });
}
