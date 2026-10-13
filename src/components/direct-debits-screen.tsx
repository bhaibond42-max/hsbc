"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Repeat } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { billPayCategories } from "@/lib/explore-visuals";
import { BankingPageIntro } from "@/components/page-intro";
import { EmptyState, PageHeader, SectionHeader, TextField } from "@/components/ui";

type Debit = { id: string; name: string; amount: string; nextDate: string; reference: string | null; accountName: string };

export function DirectDebitsScreen({
  items,
}: {
  items: Debit[];
  accounts: { id: string; name: string }[];
}) {
  const [filter, setFilter] = useState("");

  const filtered = items.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="md:pt-2">
      <PageHeader title="Direct debits" back="/home" />
      <div className="space-y-4 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Direct debits & bill pay"
          description="View active mandates and upcoming collection dates."
          icon={Repeat}
          imageSrc="/ui/hero-payments.svg"
        />
        <TextField label="Search mandates" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Company name" />
        {filtered.length === 0 ? (
          <EmptyState title="No direct debits" body="Regular bills set up on your account will be listed here with next collection dates." />
        ) : (
          <ul className="panel overflow-hidden p-0">
            {filtered.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <span>
                  <span className="block text-sm font-medium text-charcoal">{item.name}</span>
                  <span className="text-xs text-muted">
                    {item.accountName} · next {formatDate(item.nextDate)}
                    {item.reference ? ` · ${item.reference}` : ""}
                  </span>
                </span>
                <span className="text-right text-sm font-semibold tabular-nums">{formatGBP(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <section className="panel p-4">
          <SectionHeader title="Bill categories" description="Overview of bill types linked to direct debits." />
          <div className="grid gap-2 sm:grid-cols-3">
            {billPayCategories.map((cat) => (
              <span key={cat.id} className="rounded-md border border-line bg-mist/50 px-3 py-2 text-xs font-medium text-charcoal">
                {cat.label}
              </span>
            ))}
          </div>
          <Link href="/explore/bill-pay" className="mt-3 inline-block text-sm font-semibold text-brand">
            Bill pay overview
          </Link>
        </section>
      </div>
    </div>
  );
}
