import { prisma } from "@/lib/db";
import { badRequest, json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { normaliseAmount, toPence } from "@/lib/money";
import { deleteTransactionSchema, updateTransactionSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import {
  adminDeleteTransaction,
  applyBalanceDelta,
  settlePending,
  transactionBalanceDelta,
  writeAudit,
} from "@/server/ledger";
import { serializeTxn } from "@/server/serialize";
import { txnInclude } from "@/server/queries";

export const PATCH = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, updateTransactionSchema);
  const meta = requestMeta(req);
  const existing = await prisma.transaction.findUnique({ where: { id: params.id }, include: txnInclude });
  if (!existing) throw notFound("Transaction not found");
  if (existing.status === "REVERSED" || existing.reversalOfId) {
    throw badRequest("Reversal entries cannot be edited. Create a new adjustment instead.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    let working = existing;

    if (input.status && working.status === "PENDING") {
      if (input.status === "PENDING") {
        /* keep pending */
      } else if (input.status === "FAILED" || input.status === "COMPLETED") {
        working = await settlePending(
          tx,
          working.id,
          input.status === "FAILED" ? "FAILED" : "COMPLETED",
          admin.user.id,
          { allowNegativeBalance: true },
        );
      }
    }

    const amountChanging = input.amount !== undefined || input.type !== undefined;
    if (amountChanging && working.status === "COMPLETED") {
      const oldDelta = transactionBalanceDelta(working.type, toPence(working.amount.toString()));
      const nextType = input.type ?? working.type;
      const nextAmount = normaliseAmount(input.amount ?? working.amount.toString());
      const newDelta = transactionBalanceDelta(nextType, toPence(nextAmount));
      const balanceAfter = await applyBalanceDelta(tx, working.accountId, newDelta - oldDelta, true);
      working = await tx.transaction.update({
        where: { id: working.id },
        data: {
          type: nextType,
          amount: nextAmount,
          balanceAfter,
          updatedById: admin.user.id,
        },
        include: txnInclude,
      });
    } else if (amountChanging) {
      throw badRequest("Amount and type can only be changed on completed transactions.");
    }

    const next = await tx.transaction.update({
      where: { id: working.id },
      data: {
        description: input.description ?? undefined,
        merchant: input.merchant,
        category: input.category,
        notes: input.notes,
        transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined,
        updatedById: admin.user.id,
      },
      include: txnInclude,
    });

    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "TRANSACTION_UPDATED",
      targetType: "transaction",
      targetId: existing.id,
      targetUserId: existing.account.userId,
      oldValue: {
        description: existing.description,
        category: existing.category,
        amount: existing.amount.toString(),
        type: existing.type,
        status: existing.status,
      },
      newValue: {
        description: next.description,
        category: next.category,
        amount: next.amount.toString(),
        type: next.type,
        status: next.status,
      },
      reason: input.reason,
      summary: `Updated transaction ${existing.reference}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return next;
  });
  return json({ transaction: serializeTxn(updated) });
});

export const DELETE = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, deleteTransactionSchema);
  const meta = requestMeta(req);

  const removed = await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id: params.id },
      include: { account: { select: { userId: true } } },
    });
    if (!existing) throw notFound("Transaction not found");
    await adminDeleteTransaction(tx, params.id);
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "TRANSACTION_UPDATED",
      targetType: "transaction",
      targetId: existing.id,
      targetUserId: existing.account.userId,
      oldValue: {
        reference: existing.reference,
        amount: existing.amount.toString(),
        type: existing.type,
        status: existing.status,
      },
      newValue: { deleted: true },
      reason: input.reason,
      summary: `Deleted transaction ${existing.reference}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return existing;
  });

  return json({ ok: true });
});
