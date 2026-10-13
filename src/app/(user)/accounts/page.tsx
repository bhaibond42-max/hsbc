import Link from "next/link";
import { Landmark, CreditCard } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatGBP, fromPence, toPence } from "@/lib/money";
import { requireUserPage } from "@/server/auth";
import { serializeAccount } from "@/server/serialize";
import { BankingPageIntro } from "@/components/page-intro";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default async function AccountsPage() {
  const session = await requireUserPage();
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { transactions: { orderBy: { transactionDate: "desc" }, take: 1 } },
  });
  const hidden = session.user.hideBalances;
  let totalAvailable = 0n;
  for (const account of accounts) {
    totalAvailable += toPence(account.availableBalance.toString());
  }
  return (
    <div className="md:pt-2">
      <PageHeader title="Accounts" />
      <div className="space-y-4 px-4 md:px-0">
        <BankingPageIntro
          title="Your accounts"
          description="View balances and recent activity. Account numbers are not shown in this app."
          icon={Landmark}
          imageSrc="/ui/hero-accounts.svg"
        />
        {accounts.length > 0 ? (
          <p className="panel px-4 py-3 text-sm text-muted">
            Total available:{" "}
            <span className="font-semibold text-charcoal">{hidden ? "£ ••••••" : formatGBP(fromPence(totalAvailable))}</span>
          </p>
        ) : null}
        {accounts.length === 0 ? <EmptyState title="No accounts" body="Your accounts will be listed here." /> : null}
        {accounts.map((account) => {
          const view = serializeAccount(account);
          const latest = account.transactions[0];
          return (
            <Link
              key={account.id}
              href={`/accounts/${account.id}`}
              className="panel relative block overflow-hidden p-5 transition-colors hover:border-line-strong hover:bg-brand-soft/20"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />
              <div className="flex items-start justify-between pl-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted">{view.name.toUpperCase()}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-charcoal">
                    {hidden ? "£ ••••••" : formatGBP(view.availableBalance)}
                  </p>
                  <p className="text-xs text-muted">Available balance</p>
                </div>
                <StatusBadge status={view.status} />
              </div>
              <p className="mt-4 pl-2 text-xs text-muted">
                {latest ? `Latest · ${latest.description} · ${formatDate(latest.transactionDate)}` : "No recent activity"}
              </p>
            </Link>
          );
        })}
        <Link
          href="/cards"
          className="panel flex items-center gap-3 px-5 py-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft/30"
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand">
            <CreditCard size={20} />
          </span>
          View cards
        </Link>
      </div>
    </div>
  );
}
