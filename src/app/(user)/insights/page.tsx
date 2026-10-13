import { prisma } from "@/lib/db";
import { fromPence, toPence } from "@/lib/money";
import { requireUserPage } from "@/server/auth";
import { InsightsScreen } from "@/components/insights-screen";

export default async function InsightsPage() {
  const session = await requireUserPage();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const monthLabel = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const [debits, credits] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        type: "DEBIT",
        transactionDate: { gte: start },
        account: { userId: session.user.id },
      },
      select: { amount: true, category: true },
    }),
    prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        type: "CREDIT",
        transactionDate: { gte: start },
        account: { userId: session.user.id },
      },
      select: { amount: true },
    }),
  ]);

  const totals = new Map<string, bigint>();
  let spent = 0n;
  for (const txn of debits) {
    const amount = toPence(txn.amount.toString());
    spent += amount;
    totals.set(txn.category, (totals.get(txn.category) ?? 0n) + amount);
  }
  let received = 0n;
  for (const txn of credits) {
    received += toPence(txn.amount.toString());
  }

  const categories = [...totals.entries()]
    .sort((a, b) => (a[1] > b[1] ? -1 : 1))
    .map(([name, amount]) => ({ name, value: Number(fromPence(amount)) }));

  const cashflow: { month: string; in: number; out: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() - i, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
    const label = monthStart.toLocaleDateString("en-GB", { month: "short" });
    const monthTx = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        transactionDate: { gte: monthStart, lte: monthEnd },
        account: { userId: session.user.id },
      },
      select: { amount: true, type: true },
    });
    let inn = 0;
    let out = 0;
    for (const txn of monthTx) {
      const p = Number(fromPence(toPence(txn.amount.toString())));
      if (txn.type === "CREDIT") inn += p;
      else out += p;
    }
    cashflow.push({ month: label, in: inn, out });
  }

  return (
    <InsightsScreen
      monthLabel={monthLabel}
      spent={fromPence(spent)}
      received={fromPence(received)}
      hidden={session.user.hideBalances}
      categories={categories}
      cashflow={cashflow}
    />
  );
}
