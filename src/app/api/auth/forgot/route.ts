import { prisma } from "@/lib/db";
import { json, readJson, route } from "@/lib/http";
import { forgotPasswordSchema } from "@/lib/validation";
import { newSecret } from "@/server/auth";

export const POST = route(async (req) => {
  const input = await readJson(req, forgotPasswordSchema);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const message = "If that email is registered, password reset instructions are ready.";
  if (!user || user.status === "SUSPENDED") return json({ ok: true, message });

  const { token, tokenHash } = newSecret();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const path = user.role === "ADMIN" ? "/admin/reset-password" : "/reset-password";
  const resetUrl = `${base}${path}?token=${token}`;
  if (process.env.DEMO_EXPOSE_RESET_LINK === "true") return json({ ok: true, message, resetUrl });
  return json({ ok: true, message });
});
