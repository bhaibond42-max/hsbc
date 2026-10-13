"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { BankingPageIntro } from "./page-intro";
import { formatDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { Button, Card, EmptyState, PageHeader, SectionHeader } from "./ui";

type Account = { id: string; name: string; availableBalance: string };
type Payee = { id: string; name: string };
type RecentTxn = { id: string; description: string; amount: string; type: string; transactionDate: string };

export function PaymentsScreen({
  accounts,
  payees,
  recent = [],
}: {
  accounts: Account[];
  payees: Payee[];
  hidden?: boolean;
  recent?: RecentTxn[];
}) {
  const { hidden } = useBalancePrivacy();
  const params = useSearchParams();
  const initial = params.get("mode") === "receive" ? "receive" : "transfer";
  const [mode, setMode] = useState<"transfer" | "receive">(initial);
  const tabs = [
    ["transfer", "Transfer"],
    ["receive", "Receive"],
  ] as const;

  return (
    <div className="md:pt-2">
      <PageHeader title="Payments" />
      <div className="space-y-4 px-4 md:px-0">
        <BankingPageIntro
          title="Move money securely"
          description="View payment activity and balances. Account numbers are not shown in this app."
          icon={ArrowLeftRight}
          imageSrc="/ui/hero-payments.svg"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`focus-ring shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === id ? "bg-brand text-white" : "border border-line bg-surface text-charcoal hover:bg-brand-soft/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "transfer" ? <TransferHub accounts={accounts} payees={payees} recent={recent} hidden={hidden} /> : null}
        {mode === "receive" ? <ReceiveDetails accounts={accounts} hidden={hidden} recent={recent} /> : null}
      </div>
    </div>
  );
}

function TransferHub({
  accounts,
  payees,
  recent,
  hidden,
}: {
  accounts: Account[];
  payees: Payee[];
  recent: RecentTxn[];
  hidden: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <SectionHeader title="Your accounts" description="Balances for reference only." />
        {accounts.length === 0 ? (
          <EmptyState title="No accounts" body="Accounts linked to your profile appear here." />
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex justify-between border-b border-line py-2 text-sm last:border-b-0">
              <span className="font-medium text-charcoal">{account.name}</span>
              <span className="font-semibold tabular-nums">{hidden ? "£ ••••" : formatGBP(account.availableBalance)}</span>
            </div>
          ))
        )}
      </Card>
      <PayeeTransfer payees={payees} />
      {recent.length > 0 ? (
        <Card padding="none">
          <div className="border-b border-line px-4 py-2">
            <SectionHeader title="Recent activity" description="Latest completed entries on your accounts." />
          </div>
          {recent.map((txn) => (
            <Link key={txn.id} href={`/transactions/${txn.id}`} className="flex justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-mist/50">
              <span className="min-w-0 truncate pr-3">{txn.description}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {hidden ? "£ ••••" : formatGBP(txn.amount)}
                <span className="block text-right text-xs font-normal text-muted">{formatDate(txn.transactionDate)}</span>
              </span>
            </Link>
          ))}
        </Card>
      ) : null}
    </div>
  );
}

function PayeeTransfer({ payees }: { payees: Payee[] }) {
  return (
    <Card padding="none">
      <div className="border-b border-line px-4 py-2">
        <SectionHeader title="Saved payees" description="Names only — details are not displayed here." />
      </div>
      {payees.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No payees" body="Payees set up on your account will appear here." />
        </div>
      ) : (
        payees.map((payee) => (
          <div key={payee.id} className="border-b border-line px-4 py-3 last:border-b-0">
            <p className="font-medium text-charcoal">{payee.name}</p>
          </div>
        ))
      )}
    </Card>
  );
}

function ReceiveDetails({ accounts, hidden, recent }: { accounts: Account[]; hidden: boolean; recent: RecentTxn[] }) {
  const primary = accounts[0];
  if (!primary) return <EmptyState title="No account" body="Open a savings account to receive payments." />;
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-charcoal">Receive money</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sort code and account number are not shown or copyable in this app. To share receiving details, contact HSBC UK
          or use documentation provided by your branch.
        </p>
        <p className="mt-3 text-sm text-charcoal">
          Account: <span className="font-medium">{primary.name}</span>
        </p>
      </Card>
      {recent.filter((t) => t.type === "CREDIT").length > 0 ? (
        <Card padding="none">
          <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase text-muted">Recent incoming</div>
          {recent
            .filter((t) => t.type === "CREDIT")
            .slice(0, 5)
            .map((txn) => (
              <Link key={txn.id} href={`/transactions/${txn.id}`} className="block border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-mist/50">
                {txn.description} · {hidden ? "£ ••••" : formatGBP(txn.amount)}
              </Link>
            ))}
        </Card>
      ) : null}
      <Link href="/transactions?view=IN">
        <Button type="button" variant="ghost" className="w-full">
          View all incoming transactions
        </Button>
      </Link>
    </div>
  );
}
