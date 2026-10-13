import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { requireAdminPage } from "@/server/auth";
import { loadStats } from "@/server/stats";
import { OverviewCharts } from "@/components/charts";
import { CurrencyAmount } from "@/components/bank";
import { Card, SectionHeader } from "@/components/ui";

export default async function DashboardPage() {
  await requireAdminPage();
  const stats = await loadStats();
  const tiles = [
    ["Customers", String(stats.totalUsers)],
    ["Active", String(stats.activeUsers)],
    ["Suspended", String(stats.suspendedUsers)],
    ["Accounts", String(stats.totalAccounts)],
    ["Balances", formatGBP(stats.totalBalance)],
    ["Credits", formatGBP(stats.totalCredits)],
    ["Debits", formatGBP(stats.totalDebits)],
    ["Today", String(stats.transactionsToday)],
  ];
  return (
    <div className="rise space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Staff console</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-charcoal md:text-3xl">Overview</h1>
        <p className="mt-2 text-sm text-muted">Balances and customer activity across the bank.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label} padding="sm" className="transition-colors hover:border-line-strong">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-charcoal">{value}</p>
          </Card>
        ))}
      </div>
      <OverviewCharts data={stats.chart} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <div className="px-4 pt-4">
            <SectionHeader title="Recent transactions" />
          </div>
          <div className="border-t border-line">
            {stats.recentTransactions.map((txn) => (
              <Link
                key={txn.id}
                href="/admin/transactions"
                className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-mist/80"
              >
                <span>
                  <span className="block text-sm font-medium text-charcoal">{txn.description}</span>
                  <span className="text-xs text-muted">{txn.ownerName}</span>
                </span>
                <CurrencyAmount amount={txn.amount} type={txn.type} />
              </Link>
            ))}
          </div>
        </Card>
        <Card padding="none">
          <div className="px-4 pt-4">
            <SectionHeader title="Recent staff actions" />
          </div>
          <div className="border-t border-line">
            {stats.recentActions.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted">No staff actions yet.</p>
            ) : null}
            {stats.recentActions.map((action) => (
              <div key={action.id} className="border-b border-line px-4 py-3.5 last:border-b-0">
                <p className="text-sm text-charcoal">{action.summary}</p>
                <p className="mt-1 text-xs text-muted">
                  {action.adminName} · {formatDateTime(action.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
