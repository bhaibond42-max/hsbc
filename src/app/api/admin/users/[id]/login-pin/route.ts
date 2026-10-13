import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { adminLoginPinSchema } from "@/lib/validation";
import { hashPassword, requireAdminApi } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const PUT = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, adminLoginPinSchema);
  const meta = requestMeta(req);
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== "USER") throw notFound("Customer not found");

  const loginPinHash =
    input.pin === undefined ? existing.loginPinHash : input.pin ? await hashPassword(input.pin) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.user.update({
      where: { id: existing.id },
      data: { loginPinHash },
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "USER_UPDATED",
      targetType: "user",
      targetId: existing.id,
      targetUserId: existing.id,
      oldValue: { hasLoginPin: Boolean(existing.loginPinHash) },
      newValue: { hasLoginPin: Boolean(loginPinHash) },
      reason: input.reason,
      summary: loginPinHash
        ? `Set log on PIN for ${next.fullName}`
        : `Removed log on PIN for ${next.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return next;
  });

  return json({ ok: true, hasLoginPin: Boolean(updated.loginPinHash) });
});
