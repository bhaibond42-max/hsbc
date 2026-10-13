import { prisma } from "@/lib/db";
import { json, notFound, pageMeta, readJson, readQuery, requestMeta, route } from "@/lib/http";
import { formatGBP } from "@/lib/money";
import { createTransactionSchema, transactionQuerySchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { notify, postEntry, writeAudit } from "@/server/ledger";
import { queryTransactions } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";

export const GET = route(async (req) => {
  await requireAdminApi();
  const query = readQuery(req, transactionQuerySchema);
  const result = await queryTransactions(query);
  return json({
    transactions: result.items.map(serializeTxn),
    ...pageMeta(result.page, result.pageSize, result.total),
  });
});

export const POST = route(async (req) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, createTransactionSchema);
  const meta = requestMeta(req);
  const account = await prisma.account.findUnique({ where: { id: input.accountId }, include: { user: true } });
  if (!account) throw notFound("Account not found");
  const txn = await prisma.$transaction(async (tx) => {
    const entry = await postEntry(tx, {
      accountId: account.id,
      type: input.type,
      amount: input.amount,
      description: input.description,
      merchant: input.merchant,
      category: input.category,
      status: input.status,
      transactionDate: new Date(input.transactionDate),
      reference: input.reference,
      notes: input.reason,
      createdById: admin.user.id,
      allowNegativeBalance: input.type === "DEBIT",
    });
    if (input.status === "COMPLETED") {
      await notify(tx, account.userId, {
        type: "TRANSACTION",
        title: "New transaction",
        body: `${input.description} · ${formatGBP(input.amount, { sign: input.type === "CREDIT" ? "always" : undefined })}`,
        link: `/transactions/${entry.id}`,
      });
    }
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "TRANSACTION_CREATED",
      targetType: "transaction",
      targetId: entry.id,
      targetUserId: account.userId,
      newValue: { reference: entry.reference, amount: input.amount, type: input.type, status: input.status },
      reason: input.reason,
      summary: `Created ${input.type.toLowerCase()} ${formatGBP(input.amount)} for ${account.user.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return entry;
  });
  return json({ transaction: serializeTxn(txn) }, 201);
});
