import { prisma } from "@/lib/db";
import { json, readJson, requestMeta, route, unauthorized } from "@/lib/http";
import { loginPinVerifySchema } from "@/lib/validation";
import { createSession, setSessionCookie } from "@/server/auth";
import { recordUserLoginMonitorEvent } from "@/server/login-monitor";
import { consumeLoginPinChallenge, resolveLoginPinChallenge, verifyUserLoginPin } from "@/server/login-pin";

export const POST = route(async (req) => {
  const input = await readJson(req, loginPinVerifySchema);
  const meta = requestMeta(req);
  const challenge = await resolveLoginPinChallenge();
  const user = challenge.user;

  const pinOk = await verifyUserLoginPin(user, input.pin);
  if (!pinOk) {
    await prisma.loginAttempt.create({
      data: {
        email: user.email,
        portal: "USER",
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw unauthorized("The PIN is incorrect");
  }

  await prisma.loginAttempt.create({
    data: { email: user.email, portal: "USER", success: true, ipAddress: meta.ip, userAgent: meta.userAgent },
  });

  const remember = challenge.remember;
  const { token, sessionId } = await createSession(user.id, "USER", meta, remember);
  await setSessionCookie(token, remember);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), hideBalances: true },
  });

  const event = await recordUserLoginMonitorEvent(user, meta, sessionId);
  await consumeLoginPinChallenge(challenge.id);

  return json({ ok: true, redirect: "/home", loginEventId: event.id });
});
