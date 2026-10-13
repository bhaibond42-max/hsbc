import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import type { Portal, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";
import { forbidden, unauthorized } from "@/lib/http";

const SESSION_MS = 12 * 60 * 60 * 1000;
const REMEMBER_MS = 14 * 24 * 60 * 60 * 1000;

let dummyHash: string | null = null;

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

/** Keeps the "unknown email" path on a similar timer to a real password check. */
export async function burnPasswordCheck(password: string) {
  dummyHash ??= await hash("demo-placeholder", 12);
  await compare(password, dummyHash);
}

export function newSecret() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export async function createSession(
  userId: string,
  portal: Portal,
  meta: { ip: string; userAgent: string },
  remember: boolean,
) {
  const { token, tokenHash } = newSecret();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      portal,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + (remember ? REMEMBER_MS : SESSION_MS)),
    },
  });
  return { token, sessionId: session.id };
}

export async function setSessionCookie(token: string, remember: boolean) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor((remember ? REMEMBER_MS : SESSION_MS) / 1000),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type AuthContext = {
  sessionId: string;
  portal: Portal;
  user: User;
};

export async function getSession(): Promise<AuthContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;
  return { sessionId: session.id, portal: session.portal, user: session.user };
}

export async function destroyCurrentSession() {
  const current = await getSession();
  if (current) await prisma.session.delete({ where: { id: current.sessionId } }).catch(() => undefined);
  await clearSessionCookie();
}

export async function requireUserApi() {
  const current = await getSession();
  if (!current) throw unauthorized();
  if (current.user.role !== "USER" || current.portal !== "USER") throw forbidden();
  return current;
}

export async function requireAdminApi() {
  const current = await getSession();
  if (!current) throw unauthorized();
  if (current.user.role !== "ADMIN" || current.portal !== "ADMIN") throw forbidden();
  return current;
}

export async function requireUserPage() {
  const current = await getSession();
  if (!current) redirect("/login");
  if (current.user.role !== "USER") redirect("/admin/dashboard");
  return current;
}

export async function requireAdminPage() {
  const current = await getSession();
  if (!current) redirect("/login");
  if (current.user.role !== "ADMIN") redirect("/home");
  return current;
}
