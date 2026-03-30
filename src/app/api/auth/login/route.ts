import { NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

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
