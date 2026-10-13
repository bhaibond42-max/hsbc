import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { updateAccountSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { writeAudit } from "@/server/ledger";
import { serializeAccount } from "@/server/serialize";

export const PATCH = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, updateAccountSchema);
  const meta = requestMeta(req);
  const account = await prisma.account.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!account) throw notFound("Account not found");

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.account.update({
      where: { id: account.id },
      data: {
        name: input.name,
        dailyLimit: input.dailyLimit,
        ...(input.cardLast4 !== undefined ? { cardLast4: input.cardLast4 } : {}),
      },
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "USER_UPDATED",
      targetType: "account",
      targetId: account.id,
      targetUserId: account.userId,
      oldValue: {
        name: account.name,
        dailyLimit: account.dailyLimit.toString(),
        cardLast4: account.cardLast4,
      },
      newValue: {
        name: next.name,
        dailyLimit: next.dailyLimit.toString(),
        cardLast4: next.cardLast4,
      },
      reason: input.reason,
      summary: `Updated account ${next.name} for ${account.user.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return next;
  });
  return json({ account: serializeAccount(updated, true) });
});
