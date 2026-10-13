import { prisma } from "@/lib/db";
import { forbidden, json, readJson, requestMeta, route, tooManyRequests, unauthorized } from "@/lib/http";
import { adminLoginSchema } from "@/lib/validation";
import { burnPasswordCheck, createSession, setSessionCookie, verifyPassword } from "@/server/auth";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export const POST = route(async (req) => {
  const input = await readJson(req, adminLoginSchema);
  const meta = requestMeta(req);
  const since = new Date(Date.now() - WINDOW_MS);
  const fails = await prisma.loginAttempt.count({
    where: { email: input.email, portal: "ADMIN", success: false, createdAt: { gte: since } },
  });
  if (fails >= MAX_FAILS) throw tooManyRequests("Staff log on is paused for 15 minutes.");

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user) await burnPasswordCheck(input.password);

  if (!user || !passwordOk || user.role !== "ADMIN") {
    await prisma.loginAttempt.create({
      data: { email: input.email, portal: "ADMIN", success: false, ipAddress: meta.ip, userAgent: meta.userAgent },
    });
    if (user && passwordOk && user.role !== "ADMIN") throw forbidden("This log on is for staff only");
    throw unauthorized("The email or password is incorrect");
  }
  if (user.status !== "ACTIVE") throw forbidden("This staff account is not active");

  if (user.twoFactorEnabled) {
    if (!input.code) return json({ needsCode: true, error: "Enter your 6-digit staff code" }, 401);
    const codeOk = user.twoFactorSecret ? await verifyPassword(input.code, user.twoFactorSecret) : false;
    if (!codeOk) {
      await prisma.loginAttempt.create({
        data: { email: input.email, portal: "ADMIN", success: false, ipAddress: meta.ip, userAgent: meta.userAgent },
      });
      throw unauthorized("The staff code is incorrect");
    }
  }

  await prisma.loginAttempt.create({
    data: { email: input.email, portal: "ADMIN", success: true, ipAddress: meta.ip, userAgent: meta.userAgent },
  });
  const { token } = await createSession(user.id, "ADMIN", meta, false);
  await setSessionCookie(token, false);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return json({ ok: true, redirect: "/admin/dashboard" });
});
