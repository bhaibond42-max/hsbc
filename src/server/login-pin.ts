import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { LOGIN_PIN_CHALLENGE_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/http";
import { newSecret, verifyPassword } from "@/server/auth";

const CHALLENGE_MS = 10 * 60 * 1000;

export function greetingFirstName(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0];
  return first || fullName;
}

function hashChallengeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function setLoginPinChallengeCookie(token: string) {
  const jar = await cookies();
  jar.set(LOGIN_PIN_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(CHALLENGE_MS / 1000),
  });
}

export async function clearLoginPinChallengeCookie() {
  const jar = await cookies();
  jar.delete(LOGIN_PIN_CHALLENGE_COOKIE);
}

export async function beginLoginPinChallenge(
  userId: string,
  remember: boolean,
  meta: { ip: string; userAgent: string },
) {
  const { token, tokenHash } = newSecret();
  await prisma.loginPinChallenge.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
  await prisma.loginPinChallenge.create({
    data: {
      userId,
      tokenHash,
      remember,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + CHALLENGE_MS),
    },
  });
  return token;
}

export async function resolveLoginPinChallenge() {
  const jar = await cookies();
  const token = jar.get(LOGIN_PIN_CHALLENGE_COOKIE)?.value;
  if (!token) throw unauthorized("Your log on session expired. Please start again.");
  const tokenHash = hashChallengeToken(token);
  const challenge = await prisma.loginPinChallenge.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
    await clearLoginPinChallengeCookie();
    throw unauthorized("Your log on session expired. Please start again.");
  }
  if (challenge.user.status !== "ACTIVE" || challenge.user.role !== "USER") {
    throw forbidden("This account cannot log on.");
  }
  return challenge;
}

export async function verifyUserLoginPin(user: Pick<User, "loginPinHash">, pin: string) {
  if (!user.loginPinHash) return false;
  return verifyPassword(pin, user.loginPinHash);
}

export async function consumeLoginPinChallenge(challengeId: string) {
  await prisma.loginPinChallenge.delete({ where: { id: challengeId } }).catch(() => undefined);
  await clearLoginPinChallengeCookie();
}
