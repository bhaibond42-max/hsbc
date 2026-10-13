import { prisma } from "@/lib/db";
import { fromPence, toPence } from "@/lib/money";
import { requireUserPage } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeAccount, serializeTxn } from "@/server/serialize";
import { HomeScreen } from "@/components/home-screen";

export default async function HomePage() {
  const session = await requireUserPage();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [accounts, recent, spent, nextDebit] = await Promise.all([
    prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
    queryTransactions({ page: 1, pageSize: 6 }, session.user.id),
    prisma.transaction.findMany({
      where: {
        type: "DEBIT",
        status: "COMPLETED",
        transactionDate: { gte: monthStart },
        account: { userId: session.user.id },
      },
      select: { amount: true },
    }),
    prisma.directDebit.findFirst({
      where: { userId: session.user.id, active: true },
      orderBy: { nextDate: "asc" },
    }),
  ]);
  let spentPence = 0n;
  for (const txn of spent) spentPence += toPence(txn.amount.toString());
  const monthSpent = fromPence(spentPence);
  return (
    <HomeScreen
      fullName={session.user.fullName}
      hideBalances={session.user.hideBalances}
      notifyTransactions={session.user.notifyTransactions}
      notifyStatements={session.user.notifyStatements}
      accounts={accounts.map((account) => serializeAccount(account))}
      transactions={recent.items.map(serializeTxn)}
      monthSpent={monthSpent}
      nextDebit={
        nextDebit
          ? { name: nextDebit.name, amount: nextDebit.amount.toString(), nextDate: nextDebit.nextDate.toISOString() }
          : null
      }
    />
  );
}
