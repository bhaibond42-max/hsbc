import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { badRequest, json, readJson, route } from "@/lib/http";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const POST = route(async (req) => {
  const input = await readJson(req, resetPasswordSchema);
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw badRequest("This reset link is invalid or has expired");
  }
  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, status: record.user.status === "LOCKED" ? "ACTIVE" : record.user.status },
    });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: record.userId } });
    await writeAudit(tx, {
      actorId: record.userId,
      actorEmail: record.user.email,
      action: "PASSWORD_RESET",
      targetType: "user",
      targetId: record.userId,
      targetUserId: record.userId,
      summary: "Password reset completed",
      reason: "Password reset",
    });
  });
  return json({ ok: true });
});
