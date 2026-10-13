import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { forbidden } from "@/lib/http";
import type { z } from "zod";
import type { transactionQuerySchema } from "@/lib/validation";

type TransactionQuery = z.infer<typeof transactionQuerySchema>;

const txnInclude = {
  account: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  reversedBy: { select: { id: true } },
} satisfies Prisma.TransactionInclude;

export function buildTransactionWhere(input: Partial<TransactionQuery>, scopeUserId?: string) {
  const account: Prisma.AccountWhereInput = {};
  if (scopeUserId && input.userId && input.userId !== scopeUserId) throw forbidden();
  const userId = scopeUserId ?? input.userId;
  if (userId) account.userId = userId;

  const where: Prisma.TransactionWhereInput = {};
  if (input.accountId) where.accountId = input.accountId;
  if (Object.keys(account).length) where.account = account;
  if (input.type) where.type = input.type;
  if (input.status) where.status = input.status;
  if (input.category) where.category = input.category;
  if (input.from || input.to) {
    where.transactionDate = {};
    if (input.from) where.transactionDate.gte = new Date(input.from);
    if (input.to) {
      const end = new Date(input.to);
      end.setHours(23, 59, 59, 999);
      where.transactionDate.lte = end;
    }
  }
  if (input.min || input.max) {
    where.amount = {};
    if (input.min) where.amount.gte = input.min;
    if (input.max) where.amount.lte = input.max;
  }
  if (input.q) {
    where.OR = [
      { description: { contains: input.q, mode: "insensitive" } },
      { merchant: { contains: input.q, mode: "insensitive" } },
      { reference: { contains: input.q, mode: "insensitive" } },
      { category: { contains: input.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function queryTransactions(input: Partial<TransactionQuery>, scopeUserId?: string) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const where = buildTransactionWhere(input, scopeUserId);
  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: txnInclude,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, items, page, pageSize };
}

export async function getOwnedTransaction(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { id, account: { userId } },
    include: txnInclude,
  });
}

export { txnInclude };
