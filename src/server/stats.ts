import { prisma } from "@/lib/db";

type Month = { label: string; users: number; credits: number; debits: number; volume: number };

export async function loadStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() - 5, 1);
  sixMonths.setHours(0, 0, 0, 0);

  const [users, accounts, balance, credits, debits, today, recentTxns, recentActions, growthUsers, volumeTxns] =
    await Promise.all([
      prisma.user.groupBy({ by: ["status"], where: { role: "USER" }, _count: true }),
      prisma.account.count(),
      prisma.account.aggregate({ _sum: { currentBalance: true } }),
      prisma.transaction.aggregate({ where: { type: "CREDIT", status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "DEBIT", status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { account: { include: { user: { select: { fullName: true } } } } },
      }),
      prisma.adminAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { admin: { select: { fullName: true } } },
      }),
      prisma.user.findMany({ where: { role: "USER", createdAt: { gte: sixMonths } }, select: { createdAt: true } }),
      prisma.transaction.findMany({
        where: { status: "COMPLETED", transactionDate: { gte: sixMonths } },
        select: { transactionDate: true, type: true, amount: true },
      }),
    ]);

  const count = (status: string) => users.find((row) => row.status === status)?._count ?? 0;
  const months: Month[] = [];
  const bucket = new Map<string, Month>();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - i, 1);
    const row: Month = { label: date.toLocaleDateString("en-GB", { month: "short" }), users: 0, credits: 0, debits: 0, volume: 0 };
    months.push(row);
    bucket.set(`${date.getFullYear()}-${date.getMonth()}`, row);
  }
  for (const user of growthUsers) {
    const row = bucket.get(`${user.createdAt.getFullYear()}-${user.createdAt.getMonth()}`);
    if (row) row.users += 1;
  }
  for (const txn of volumeTxns) {
    const row = bucket.get(`${txn.transactionDate.getFullYear()}-${txn.transactionDate.getMonth()}`);
    if (!row) continue;
    const pounds = Number(txn.amount.toString());
    row.volume += 1;
    if (txn.type === "CREDIT") row.credits += pounds;
    else row.debits += pounds;
  }

  return {
    totalUsers: count("ACTIVE") + count("SUSPENDED") + count("LOCKED"),
    activeUsers: count("ACTIVE"),
    suspendedUsers: count("SUSPENDED"),
    lockedUsers: count("LOCKED"),
    totalAccounts: accounts,
    totalBalance: balance._sum.currentBalance?.toString() ?? "0.00",
    totalCredits: credits._sum.amount?.toString() ?? "0.00",
    totalDebits: debits._sum.amount?.toString() ?? "0.00",
    transactionsToday: today,
    chart: months.map((month) => ({ ...month, credits: Math.round(month.credits), debits: Math.round(month.debits) })),
    recentTransactions: recentTxns.map((txn) => ({
      id: txn.id,
      description: txn.description,
      amount: txn.amount.toString(),
      type: txn.type as "CREDIT" | "DEBIT",
      ownerName: txn.account.user.fullName,
      createdAt: txn.createdAt.toISOString(),
    })),
    recentActions: recentActions.map((action) => ({
      id: action.id,
      summary: action.summary,
      adminName: action.admin.fullName,
      createdAt: action.createdAt.toISOString(),
    })),
  };
}
