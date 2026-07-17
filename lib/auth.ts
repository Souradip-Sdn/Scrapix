import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import db from "@/lib/db";
import type { SessionUser, UserRole } from "@/lib/types";

const COOKIE_NAME = "scrapix_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.id);
    if (!id) return null;
    const [user] = await db`SELECT id, name, email, role FROM users WHERE id = ${id}`;
    return (user as SessionUser | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireApiUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Authentication required", status: 401 } as const;
  if (roles && !roles.includes(user.role))
    return { error: "You do not have permission", status: 403 } as const;
  return { user } as const;
}
