import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/utils";

const SESSION_COOKIE = "avtoslot_session";

type SessionPayload = {
  userId: string;
  role: UserRole;
};

function secretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "local-avtoslot-secret-change-me",
  );
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const result = await jwtVerify(token, secretKey());
    return result.payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getSessionFromRequest(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      employee: true,
    },
  });
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      employee: true,
    },
  });
}

export async function requirePageUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  if (roles && !roles.includes(user.role)) {
    redirect(roleHome(user.role));
  }

  return user;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
