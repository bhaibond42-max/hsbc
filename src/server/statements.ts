import { prisma } from "@/lib/db";
import { notFound } from "@/lib/http";
import { fromPence, toPence } from "@/lib/money";
import { txnInclude } from "@/server/queries";

export async function loadStatement(userId: string, accountId: string, from: string, to: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw notFound("Account not found");
  const start = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  if (end < start) throw notFound("The end date is before the start date");

  const prior = await prisma.transaction.findFirst({
    where: { accountId: account.id, status: "COMPLETED", transactionDate: { lt: start } },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
  });
  const items = await prisma.transaction.findMany({
    where: {
      accountId: account.id,
      status: { not: "FAILED" },
      transactionDate: { gte: start, lte: end },
    },
    include: txnInclude,
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });
  const opening = prior ? prior.balanceAfter.toString() : "0.00";
  let credits = 0n;
  let debits = 0n;
  for (const item of items) {
    if (item.status !== "COMPLETED") continue;
    const amount = toPence(item.amount.toString());
    if (item.type === "CREDIT") credits += amount;
    else debits += amount;
  }
  const lastCompleted = [...items].reverse().find((item) => item.status === "COMPLETED");
  const closing = lastCompleted ? lastCompleted.balanceAfter.toString() : opening;
  return { account, opening, closing, credits: fromPence(credits), debits: fromPence(debits), items, start, end };
}
