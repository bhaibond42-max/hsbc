import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { accountStatusSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { notify, writeAudit } from "@/server/ledger";
import { serializeAccount } from "@/server/serialize";

export const POST = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, accountStatusSchema);
  const meta = requestMeta(req);
  const account = await prisma.account.findUnique({ where: { id: params.id } });
  if (!account) throw notFound("Account not found");
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.account.update({ where: { id: account.id }, data: { status: input.status } });
    await notify(tx, account.userId, {
      type: "SECURITY",
      title: input.status === "SUSPENDED" ? "Account suspended" : "Account active",
      body: `${account.name} is now ${input.status.toLowerCase()}. ${input.reason}`,
      link: `/accounts/${account.id}`,
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: input.status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_ACTIVATED",
      targetType: "account",
      targetId: account.id,
      targetUserId: account.userId,
      oldValue: { status: account.status },
      newValue: { status: input.status },
      reason: input.reason,
      summary: `${account.name} set to ${input.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return next;
  });
  return json({ account: serializeAccount(updated, true) });
});
