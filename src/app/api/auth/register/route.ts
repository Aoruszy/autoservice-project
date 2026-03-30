import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CLIENT",
    },
  });

  const token = await createSessionToken({ userId: user.id, role: user.role });
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
  setSessionCookie(response, token);

  return response;
}
