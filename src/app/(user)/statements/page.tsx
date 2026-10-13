import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { statementQuerySchema } from "@/lib/validation";
import { requireUserPage } from "@/server/auth";
import { loadStatement } from "@/server/statements";
import { serializeTxn } from "@/server/serialize";
import { TransactionItem } from "@/components/bank";
import { MetricCard, MetricGrid } from "@/components/banking/metrics";
import { BankingPageIntro } from "@/components/page-intro";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui";

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireUserPage();
  const raw = await searchParams;
  const accounts = await prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  const parsed = statementQuerySchema.safeParse({
    accountId: raw.accountId || accounts[0]?.id,
    from: raw.from || defaultFrom,
    to: raw.to || defaultTo,
  });

  let statement: Awaited<ReturnType<typeof loadStatement>> | null = null;
  if (parsed.success) {
    statement = await loadStatement(session.user.id, parsed.data.accountId, parsed.data.from, parsed.data.to);
  }
  const hidden = session.user.hideBalances;

  return (
    <div className="md:pt-2">
      <PageHeader title="Statements" back="/home" />
      <div className="space-y-4 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Account statements"
          description="Choose an account and period, review balances and entries, then export a CSV for your records."
          icon={FileText}
          imageSrc="/ui/hero-services.svg"
        />
        <form className="panel grid grid-cols-2 gap-3 p-4" action="/statements">
          <label className="col-span-2 text-sm">
            Account
            <select name="accountId" defaultValue={parsed.success ? parsed.data.accountId : ""} className="mt-1 h-11 w-full rounded-md border border-line px-2">
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            From
            <input type="date" name="from" defaultValue={parsed.success ? parsed.data.from.slice(0, 10) : defaultFrom} className="mt-1 h-11 w-full rounded-md border border-line px-2" />
          </label>
          <label className="text-sm">
            To
            <input type="date" name="to" defaultValue={parsed.success ? parsed.data.to.slice(0, 10) : defaultTo} className="mt-1 h-11 w-full rounded-md border border-line px-2" />
          </label>
          <button className="col-span-2 h-11 rounded-md bg-brand text-sm font-semibold text-white" type="submit">
            View statement
          </button>
        </form>
        {statement ? (
          <>
            <MetricGrid>
              <MetricCard label="Opening" value={hidden ? "£ ••••" : formatGBP(statement.opening)} />
              <MetricCard label="Closing" value={hidden ? "£ ••••" : formatGBP(statement.closing)} tone="brand" />
              <MetricCard label="Paid in" value={hidden ? "£ ••••" : formatGBP(statement.credits)} hint="Credits" />
              <MetricCard label="Paid out" value={hidden ? "£ ••••" : formatGBP(statement.debits)} hint="Debits" />
            </MetricGrid>
            <section className="panel p-4">
              <SectionHeader title="Statement summary" description={`${statement.account.name} · ${formatDate(statement.start)} – ${formatDate(statement.end)}`} />
              <p className="text-sm text-muted">CSV export includes the same rows for spreadsheet reconciliation.</p>
              <Link
                href={`/api/statements/download?accountId=${statement.account.id}&from=${parsed.success ? parsed.data.from : defaultFrom}&to=${parsed.success ? parsed.data.to : defaultTo}`}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-charcoal px-4 text-sm font-semibold text-white"
              >
                Download CSV
              </Link>
            </section>
            <div className="panel overflow-hidden p-0">
              {statement.items.length === 0 ? (
                <EmptyState title="No entries" body="Nothing was posted in this date range." />
              ) : (
                statement.items.map((txn) => {
                  const view = serializeTxn(txn);
                  return (
                    <TransactionItem
                      key={view.id}
                      id={view.id}
                      title={view.merchant || view.description}
                      category={view.category}
                      date={view.transactionDate}
                      amount={view.amount}
                      type={view.type}
                      status={view.status}
                    />
                  );
                })
              )}
            </div>
          </>
        ) : (
          <EmptyState title="Select a period" body="Choose an account and dates, then tap View statement." />
        )}
      </div>
    </div>
  );
}
