import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { formatGBP } from "@/lib/money";
import { adjustBalanceSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { staffAdjustTransactionPresentation } from "@/lib/staff-bank-transactions";
import { notify, postEntry, writeAudit } from "@/server/ledger";
import { serializeTxn } from "@/server/serialize";

export const POST = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, adjustBalanceSchema);
  const meta = requestMeta(req);
  const account = await prisma.account.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!account) throw notFound("Account not found");
  const auditReason = input.reason ?? "Balance adjusted by staff";
  const presentation = staffAdjustTransactionPresentation(input.type);
  const txn = await prisma.$transaction(async (tx) => {
    const entry = await postEntry(tx, {
      accountId: account.id,
      type: input.type,
      amount: input.amount,
      description: presentation.description,
      merchant: presentation.merchant,
      category: presentation.category,
      createdById: admin.user.id,
      allowNegativeBalance: input.type === "DEBIT",
    });
    await notify(tx, account.userId, {
      type: "TRANSACTION",
      title: presentation.notificationTitle,
      body: presentation.notificationBody(formatGBP(input.amount)),
      link: `/transactions/${entry.id}`,
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: input.type === "CREDIT" ? "BALANCE_CREDITED" : "BALANCE_DEBITED",
      targetType: "account",
      targetId: account.id,
      targetUserId: account.userId,
      oldValue: { balance: account.currentBalance.toString() },
      newValue: { balance: entry.balanceAfter.toString(), reference: entry.reference },
      reason: auditReason,
      summary: `${input.type === "CREDIT" ? "Added" : "Deducted"} ${formatGBP(input.amount)} on ${account.user.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return entry;
  });
  return json({ transaction: serializeTxn(txn) }, 201);
});
