"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { BankingPageIntro } from "@/components/page-intro";
import { Button, EmptyState, PageHeader, SectionHeader } from "@/components/ui";
import { HsbcLogo } from "@/components/logo";

type CardTxn = { id: string; title: string; amount: string; date: string; category: string };

export function CardsManager({
  cards,
  recent,
}: {
  cards: {
    id: string;
    name: string;
    cardFrozen: boolean;
    contactlessEnabled: boolean;
    onlineEnabled: boolean;
    atmEnabled: boolean;
    dailyLimit: string;
  }[];
  recent: CardTxn[];
  hidden?: boolean;
}) {
  const { hidden } = useBalancePrivacy();
  const [tab, setTab] = useState<"overview" | "controls" | "activity">("overview");
  const card = cards[0];

  const monthSpend = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    return recent.reduce((sum, txn) => sum + Number(txn.amount), 0);
  }, [recent]);

  const limitNum = Number(card?.dailyLimit ?? 500);
  const utilPct = limitNum > 0 ? Math.min(100, Math.round((monthSpend / limitNum) * 100)) : 0;

  const tabs = [
    ["overview", "Overview"],
    ["controls", "Controls & limits"],
    ["activity", "Card activity"],
  ] as const;

  return (
    <div className="md:pt-2">
      <PageHeader title="Cards" back="/home" />
      <div className="space-y-4 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Debit cards"
          description="View card artwork, spending summary, recent card transactions, and security controls."
          icon={CreditCard}
          imageSrc="/ui/hero-cards.svg"
        />
        {cards.length === 0 ? (
          <EmptyState title="No cards" body="A debit card appears with a savings account." />
        ) : (
          <>
            <p className="text-sm text-muted">
              Status: <span className="font-medium text-charcoal">{card.cardFrozen ? "Frozen" : "Active"}</span>
              {" · "}
              Daily limit:{" "}
              <span className="font-medium text-charcoal">{hidden ? "£ ••••" : formatGBP(card.dailyLimit)}</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`focus-ring shrink-0 rounded-md px-4 py-2 text-sm font-medium ${
                    tab === id ? "bg-brand text-white" : "border border-line bg-surface text-charcoal"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "overview" ? (
              <article className="overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-md">
                <div className="h-1.5 bg-brand" />
                <div className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-xs tracking-[0.16em] text-white/60">DEBIT · VISA</p>
                    <p className="mt-6 font-mono text-xl tracking-[0.25em] sm:text-2xl">•••• •••• •••• ••••</p>
                    <p className="mt-4 text-sm text-white/80">{card.name}</p>
                    <p className="text-xs text-white/50">Valid thru ••/••</p>
                  </div>
                  <HsbcLogo onDark size={64} />
                </div>
                <div className="bg-white px-5 py-4 text-neutral-950">
                  <p className="text-sm">{card.cardFrozen ? "This card is frozen — transactions will be declined." : "This card is active and ready to use."}</p>
                  <p className="mt-3 text-xs text-muted">Freeze and unfreeze are managed by HSBC UK in this view-only app.</p>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted">Daily limit utilisation (illustrative)</p>
                    <div className="mt-2 h-2 rounded-full bg-mist">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${utilPct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {hidden ? "Hidden" : `${formatGBP(monthSpend.toFixed(2))} of ${formatGBP(card.dailyLimit)}`}
                    </p>
                  </div>
                </div>
              </article>
            ) : null}
            {tab === "controls" ? (
              <div className="panel space-y-3 p-5 text-sm">
                <SectionHeader title="Card controls" description="Current settings on your debit card (view only)." />
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted">Contactless</dt>
                    <dd className="font-medium">{card.contactlessEnabled ? "On" : "Off"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Online payments</dt>
                    <dd className="font-medium">{card.onlineEnabled ? "On" : "Off"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Cash withdrawals</dt>
                    <dd className="font-medium">{card.atmEnabled ? "On" : "Off"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Daily limit</dt>
                    <dd className="font-medium">{formatGBP(card.dailyLimit)}</dd>
                  </div>
                </dl>
                <Link href="/explore/card-pin" className="block text-center text-sm font-semibold text-brand">
                  PIN guidance
                </Link>
              </div>
            ) : null}
            {tab === "activity" ? (
              <CardActivity recent={recent} hidden={hidden} />
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/statements">
                <Button type="button" variant="secondary" className="w-full">
                  Card statements
                </Button>
              </Link>
              <Link href="/explore/card-offers">
                <Button type="button" variant="secondary" className="w-full">
                  View offers
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardActivity({ recent, hidden }: { recent: CardTxn[]; hidden: boolean }) {
  if (recent.length === 0) {
    return <EmptyState title="No card transactions" body="Debit entries on linked accounts appear here." />;
  }
  return (
    <div className="panel overflow-hidden p-0">
      {recent.map((txn) => (
        <Link key={txn.id} href={`/transactions/${txn.id}`} className="flex justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-mist/40">
          <span>
            <span className="font-medium text-charcoal">{txn.title}</span>
            <span className="block text-xs text-muted">
              {txn.category} · {formatDate(txn.date)}
            </span>
          </span>
          <span className="font-semibold tabular-nums">{hidden ? "£ ••••" : formatGBP(txn.amount)}</span>
        </Link>
      ))}
    </div>
  );
}
