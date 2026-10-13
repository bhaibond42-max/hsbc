import { prisma } from "@/lib/db";
import { json, readJson, requestMeta, route, unauthorized } from "@/lib/http";
import { changePasswordSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { getSession, hashPassword, verifyPassword } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const POST = route(async (req) => {
  const current = await getSession();
  if (!current) throw unauthorized();
  if (current.user.role === "USER") assertUserCanMutate();
  const input = await readJson(req, changePasswordSchema);
  const meta = requestMeta(req);
  const ok = await verifyPassword(input.currentPassword, current.user.passwordHash);
  if (!ok) throw unauthorized("The current password is incorrect");
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: current.user.id }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: current.user.id, id: { not: current.sessionId } } });
    await writeAudit(tx, {
      actorId: current.user.id,
      actorEmail: current.user.email,
      action: "PASSWORD_CHANGED",
      targetType: "user",
      targetId: current.user.id,
      targetUserId: current.user.id,
      summary: "Password changed",
      reason: "Password change",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  });
  return json({ ok: true });
});
