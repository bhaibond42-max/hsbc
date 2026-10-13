import { prisma } from "@/lib/db";
import { json, readJson, requestMeta, route, unauthorized } from "@/lib/http";
import { disableTwoFactorSchema, enableTwoFactorSchema } from "@/lib/validation";
import { hashPassword, requireAdminApi, verifyPassword } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const POST = route(async (req) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, enableTwoFactorSchema);
  const meta = requestMeta(req);
  const ok = await verifyPassword(input.password, admin.user.passwordHash);
  if (!ok) throw unauthorized("The password is incorrect");
  const secret = await hashPassword(input.code);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: admin.user.id },
      data: { twoFactorEnabled: true, twoFactorSecret: secret },
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "ADMIN_2FA_ENABLED",
      targetType: "user",
      targetId: admin.user.id,
      targetUserId: admin.user.id,
      summary: "Staff code enabled",
      reason: "Staff code enabled",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  });
  return json({ ok: true });
});

export const DELETE = route(async (req) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, disableTwoFactorSchema);
  const meta = requestMeta(req);
  const ok = await verifyPassword(input.password, admin.user.passwordHash);
  if (!ok) throw unauthorized("The password is incorrect");
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: admin.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "ADMIN_2FA_DISABLED",
      targetType: "user",
      targetId: admin.user.id,
      targetUserId: admin.user.id,
      summary: "Staff code removed",
      reason: "Staff code removed",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  });
  return json({ ok: true });
});
