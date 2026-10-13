"use client";

import Link from "next/link";
import { firstName, formatDate, formatTodayLong, greeting } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { BalanceCard, QuickActions, TransactionItem } from "./bank";
import { HomeServices } from "./home-services";
import { EmptyState, SectionHeader, SecureSessionBadge } from "./ui";

type Account = {
  id: string;
  name: string;
  accountType: string;
  availableBalance: string;
  currentBalance: string;
  status: string;
};

type Txn = {
  id: string;
  description: string;
  merchant: string | null;
  category: string;
  transactionDate: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: string;
};

export function HomeScreen({
  fullName,
  accounts,
  transactions,
  monthSpent,
  nextDebit,
}: {
  fullName: string;
  hideBalances: boolean;
  notifyTransactions: boolean;
  notifyStatements: boolean;
  accounts: Account[];
  transactions: Txn[];
  monthSpent: string;
  nextDebit: { name: string; amount: string; nextDate: string } | null;
}) {
  const { hidden, toggle } = useBalancePrivacy();
  const primary = accounts.find((account) => account.accountType === "SAVINGS") ?? accounts[0];

  return (
    <div className="rise px-4 pt-5 md:px-0 md:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-12 md:pr-0">
        <div>
          <p className="text-sm text-muted">{greeting()}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal md:text-3xl">{firstName(fullName)}</h1>
          <p className="mt-1 text-sm text-muted">{formatTodayLong()}</p>
        </div>
        <div className="md:hidden">
          <SecureSessionBadge />
        </div>
      </div>

      <section className="mt-6">
        {primary ? (
          <BalanceCard
            name={primary.name}
            amount={primary.availableBalance}
            current={primary.currentBalance}
            status={primary.status}
            hidden={hidden}
            onToggle={toggle}
            href={`/accounts/${primary.id}`}
          />
        ) : (
          <EmptyState title="No account yet" body="An account will appear here once it is opened." />
        )}
      </section>

      {accounts.length > 1 ? (
        <div className="mt-3 grid gap-2">
          {accounts
            .filter((account) => account.id !== primary?.id)
            .map((account) => (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="panel flex items-center justify-between px-4 py-3 transition-colors hover:bg-brand-soft/40"
              >
                <span className="block text-sm font-medium text-charcoal">{account.name}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {hidden ? "£ ••••••" : formatGBP(account.availableBalance)}
                </span>
              </Link>
            ))}
        </div>
      ) : null}

      <section className="mt-8">
        <SectionHeader title="Quick actions" description="Browse banking sections" />
        <QuickActions />
      </section>

      <HomeServices />

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/insights" className="panel p-4 transition-colors hover:bg-brand-soft/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Spent this month</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-charcoal">{hidden ? "£ ••••••" : formatGBP(monthSpent)}</p>
        </Link>
        <Link href="/direct-debits" className="panel p-4 transition-colors hover:bg-brand-soft/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Next direct debit</p>
          <p className="mt-2 truncate text-sm font-semibold text-charcoal">{nextDebit ? nextDebit.name : "None set"}</p>
          <p className="mt-1 text-xs text-muted">
            {nextDebit
              ? `${hidden ? "£ ••••••" : formatGBP(nextDebit.amount)} · ${formatDate(nextDebit.nextDate)}`
              : "View mandates"}
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <SectionHeader
          title="Recent transactions"
          action={
            <Link href="/transactions" className="text-sm font-semibold text-brand hover:underline">
              See all
            </Link>
          }
        />
        <div className="panel overflow-hidden p-0">
          {transactions.length === 0 ? (
            <EmptyState title="No transactions yet" body="Payments and credits will show up here." />
          ) : (
            transactions.map((txn) => (
              <TransactionItem
                key={txn.id}
                id={txn.id}
                title={txn.merchant || txn.description}
                category={txn.category}
                date={txn.transactionDate}
                amount={txn.amount}
                type={txn.type}
                status={txn.status}
                hidden={hidden}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
