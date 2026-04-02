import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/utils";

const SESSION_COOKIE = "avtoslot_session";
const SESSION_ISSUER = "avtoslot";
const SESSION_AUDIENCE = "avtoslot-web";
const PASSWORD_SALT_ROUNDS = 12;
const DEV_JWT_SECRET = "local-avtoslot-secret-change-me-32-chars";
const DUMMY_PASSWORD_HASH =
  "$2b$12$nC1xMECN0QxVtQxmyjv7b.T44Qm0Q7h0hQX4J6fZ5M8s3k5x7P8mG";

type SessionPayload = {
  userId: string;
  role: UserRole;
};

function getJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET;

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured in production");
    }

    return DEV_JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production" && configuredSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  return configuredSecret;
}

function secretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordAgainstDummyHash(password: string) {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const result = await jwtVerify(token, secretKey(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
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
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
