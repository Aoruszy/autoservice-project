import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser(
  request: NextRequest,
  roles?: UserRole[],
) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return { error: apiError("Требуется авторизация", 401) };
  }

  if (roles && !roles.includes(user.role)) {
    return { error: apiError("Недостаточно прав", 403) };
  }

  return { user };
}
