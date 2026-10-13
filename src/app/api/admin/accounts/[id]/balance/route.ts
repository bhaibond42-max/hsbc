import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { formatGBP } from "@/lib/money";
import { setAccountBalanceSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { setAccountBalances, writeAudit } from "@/server/ledger";
import { serializeAccount } from "@/server/serialize";

export const POST = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, setAccountBalanceSchema);
  const meta = requestMeta(req);
  const account = await prisma.account.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!account) throw notFound("Account not found");

  const updated = await prisma.$transaction(async (tx) => {
    const before = account.currentBalance.toString();
    const nextBalance = await setAccountBalances(tx, account.id, input.balance, { allowNegative: true });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "BALANCE_CREDITED",
      targetType: "account",
      targetId: account.id,
      targetUserId: account.userId,
      oldValue: { balance: before },
      newValue: { balance: nextBalance },
      reason: input.reason,
      summary: `Set balance to ${formatGBP(input.balance)} on ${account.user.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return tx.account.findUnique({ where: { id: account.id } });
  });
  return json({ account: serializeAccount(updated!, true) });
});
