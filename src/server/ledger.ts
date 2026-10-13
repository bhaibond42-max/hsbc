import { randomBytes } from "crypto";
import { Prisma, type AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, notFound } from "@/lib/http";
import { fromPence, normaliseAmount, toPence } from "@/lib/money";

export type Tx = Prisma.TransactionClient;

export function makeReference() {
  return `HBUK${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function writeAudit(
  tx: Tx,
  input: {
    actorId: string;
    actorEmail: string;
    action: AuditAction;
    targetType: string;
    targetId?: string;
    targetUserId?: string | null;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    reason?: string;
    summary: string;
    ip?: string;
    userAgent?: string;
  },
) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      oldValue: input.oldValue,
      newValue: input.newValue,
      reason: input.reason,
      ipAddress: input.ip,
      userAgent: input.userAgent,
    },
  });
  await tx.adminAction.create({
    data: {
      adminId: input.actorId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      summary: input.summary,
    },
  });
}

export async function notify(
  tx: Tx,
  userId: string,
  input: { title: string; body: string; type?: "INFO" | "TRANSACTION" | "SECURITY" | "STATEMENT"; link?: string },
) {
  await tx.notification.create({
    data: {
      userId,
      type: input.type ?? "INFO",
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

export async function postEntry(
  tx: Tx,
  input: {
    accountId: string;
    type: "CREDIT" | "DEBIT";
    amount: string;
    description: string;
    category: string;
    merchant?: string;
    notes?: string;
    status?: "COMPLETED" | "PENDING" | "FAILED";
    transactionDate?: Date;
    reference?: string;
    createdById?: string;
    reversalOfId?: string;
    enforceActive?: boolean;
    /** Staff adjustments may take the account below zero (overdraft). */
    allowNegativeBalance?: boolean;
  },
) {
  await tx.$queryRaw`SELECT id FROM accounts WHERE id = CAST(${input.accountId} AS uuid) FOR UPDATE`;
  const account = await tx.account.findUnique({ where: { id: input.accountId } });
  if (!account) throw notFound("Account not found");
  if (input.enforceActive && account.status !== "ACTIVE") {
    throw badRequest("This account is not available for payments");
  }

  const status = input.status ?? "COMPLETED";
  const current = toPence(account.currentBalance.toString());
  let next = current;
  if (status === "COMPLETED") {
    const amount = toPence(input.amount);
    next = input.type === "CREDIT" ? current + amount : current - amount;
    if (next < 0n && !input.allowNegativeBalance) {
      throw badRequest("Insufficient available balance");
    }
    const balance = fromPence(next);
    await tx.account.update({
      where: { id: account.id },
      data: { currentBalance: balance, availableBalance: balance },
    });
  }

  return tx.transaction.create({
    data: {
      accountId: account.id,
      reference: input.reference ?? makeReference(),
      type: input.type,
      category: input.category,
      description: input.description,
      merchant: input.merchant,
      notes: input.notes,
      amount: normaliseAmount(input.amount),
      currency: account.currency,
      balanceAfter: fromPence(next),
      status,
      transactionDate: input.transactionDate ?? new Date(),
      reversalOfId: input.reversalOfId,
      createdById: input.createdById,
    },
    include: { account: { include: { user: true } }, reversedBy: { select: { id: true } } },
  });
}

export async function settlePending(
  tx: Tx,
  transactionId: string,
  nextStatus: "COMPLETED" | "FAILED",
  actorId: string,
  options?: { allowNegativeBalance?: boolean },
) {
  const existing = await tx.transaction.findUnique({ where: { id: transactionId } });
  if (!existing) throw notFound("Transaction not found");
  if (existing.status !== "PENDING") throw badRequest("Only pending transactions can change status");

  if (nextStatus === "FAILED") {
    return tx.transaction.update({
      where: { id: existing.id },
      data: { status: "FAILED", updatedById: actorId },
      include: { account: { include: { user: true } }, reversedBy: { select: { id: true } } },
    });
  }

  await tx.$queryRaw`SELECT id FROM accounts WHERE id = CAST(${existing.accountId} AS uuid) FOR UPDATE`;
  const account = await tx.account.findUnique({ where: { id: existing.accountId } });
  if (!account) throw notFound("Account not found");
  const current = toPence(account.currentBalance.toString());
  const amount = toPence(existing.amount.toString());
  const next = existing.type === "CREDIT" ? current + amount : current - amount;
  if (next < 0n && !options?.allowNegativeBalance) {
    throw badRequest("Insufficient available balance");
  }
  const balance = fromPence(next);
  await tx.account.update({
    where: { id: account.id },
    data: { currentBalance: balance, availableBalance: balance },
  });
  return tx.transaction.update({
    where: { id: existing.id },
    data: { status: "COMPLETED", balanceAfter: balance, updatedById: actorId },
    include: { account: { include: { user: true } }, reversedBy: { select: { id: true } } },
  });
}

export function transactionBalanceDelta(type: "CREDIT" | "DEBIT", amountPence: bigint) {
  return type === "CREDIT" ? amountPence : -amountPence;
}

export async function applyBalanceDelta(tx: Tx, accountId: string, deltaPence: bigint, allowNegative = false) {
  await tx.$queryRaw`SELECT id FROM accounts WHERE id = CAST(${accountId} AS uuid) FOR UPDATE`;
  const account = await tx.account.findUnique({ where: { id: accountId } });
  if (!account) throw notFound("Account not found");
  const next = toPence(account.currentBalance.toString()) + deltaPence;
  if (next < 0n && !allowNegative) throw badRequest("Insufficient available balance");
  const balance = fromPence(next);
  await tx.account.update({
    where: { id: accountId },
    data: { currentBalance: balance, availableBalance: balance },
  });
  return balance;
}

export async function setAccountBalances(
  tx: Tx,
  accountId: string,
  balance: string,
  options?: { allowNegative?: boolean },
) {
  await tx.$queryRaw`SELECT id FROM accounts WHERE id = CAST(${accountId} AS uuid) FOR UPDATE`;
  const normalized = normaliseAmount(balance);
  if (toPence(normalized) < 0n && !options?.allowNegative) {
    throw badRequest("Balance cannot be negative");
  }
  await tx.account.update({
    where: { id: accountId },
    data: { currentBalance: normalized, availableBalance: normalized },
  });
  return normalized;
}

export async function adminDeleteTransaction(tx: Tx, transactionId: string) {
  const existing = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { reversedBy: { select: { id: true } } },
  });
  if (!existing) throw notFound("Transaction not found");
  if (existing.reversedBy) throw badRequest("Remove the reversal entry first");
  if (existing.status === "REVERSED") throw badRequest("Reversed transactions cannot be deleted");

  if (existing.status === "COMPLETED") {
    const delta = transactionBalanceDelta(existing.type, toPence(existing.amount.toString()));
    await applyBalanceDelta(tx, existing.accountId, -delta, true);
  }
  await tx.transaction.delete({ where: { id: existing.id } });
  return existing;
}

export async function reverseTransaction(tx: Tx, transactionId: string, actorId: string, reason: string) {
  const original = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { reversedBy: true, account: true },
  });
  if (!original) throw notFound("Transaction not found");
  if (original.status !== "COMPLETED") throw badRequest("Only a completed transaction can be reversed");
  if (original.reversalOfId) throw badRequest("A reversal entry cannot itself be reversed");
  if (original.reversedBy) throw badRequest("This transaction has already been reversed");

  const reversal = await postEntry(tx, {
    accountId: original.accountId,
    type: original.type === "CREDIT" ? "DEBIT" : "CREDIT",
    amount: original.amount.toString(),
    description: `Reversal · ${original.description}`,
    merchant: original.merchant ?? undefined,
    category: "Reversal",
    notes: reason,
    createdById: actorId,
    reversalOfId: original.id,
    allowNegativeBalance: original.type === "CREDIT",
  });
  await tx.transaction.update({
    where: { id: original.id },
    data: { status: "REVERSED", updatedById: actorId },
  });
  return { original, reversal };
}

export { prisma };
