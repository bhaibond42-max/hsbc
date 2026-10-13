"use client";

import Link from "next/link";
import { PieChart } from "lucide-react";
import { formatGBP } from "@/lib/money";
import { BankingPageIntro } from "@/components/page-intro";
import { MetricCard, MetricGrid } from "@/components/banking/metrics";
import { MonthlyCashflowChart, SpendingByCategoryChart } from "@/components/banking/user-charts";
import { Card, PageHeader, SectionHeader } from "@/components/ui";

export function InsightsScreen({
  monthLabel,
  spent,
  received,
  hidden,
  categories,
  cashflow,
}: {
  monthLabel: string;
  spent: string;
  received: string;
  hidden: boolean;
  categories: { name: string; value: number }[];
  cashflow: { month: string; in: number; out: number }[];
}) {
  const spentNum = Number(spent);
  const receivedNum = Number(received);
  const net = receivedNum - spentNum;

  return (
    <div className="md:pt-2">
      <PageHeader title="Insights" back="/home" />
      <div className="space-y-6 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Your money this month"
          description="Spending by category, cashflow trends, and links to transactions — calculated from your account activity."
          icon={PieChart}
          imageSrc="/ui/hero-services.svg"
        />
        <MetricGrid>
          <MetricCard label={monthLabel} value={hidden ? "£ ••••••" : formatGBP(spent)} hint="Paid out" tone="brand" />
          <MetricCard label="Paid in" value={hidden ? "£ ••••••" : formatGBP(received)} />
          <MetricCard
            label="Net"
            value={hidden ? "£ ••••••" : formatGBP(net.toFixed(2))}
            hint={net >= 0 ? "Surplus" : "Deficit"}
          />
          <MetricCard label="Categories" value={String(categories.length)} hint="With activity" />
        </MetricGrid>
        <Card padding="md">
          <SectionHeader title="Spending by category" description="Based on completed debit transactions this month." />
          <SpendingByCategoryChart rows={categories} hidden={hidden} />
        </Card>
        <Card padding="md">
          <SectionHeader title="Cashflow trend" description="Last six months — paid in vs paid out." />
          <MonthlyCashflowChart rows={cashflow} hidden={hidden} />
        </Card>
        <div className="flex flex-wrap gap-3">
          <Link href="/transactions?view=OUT" className="text-sm font-semibold text-brand hover:underline">
            Outgoing transactions
          </Link>
          <Link href="/transactions?view=IN" className="text-sm font-semibold text-brand hover:underline">
            Incoming transactions
          </Link>
          <Link href="/statements" className="text-sm font-semibold text-brand hover:underline">
            Statements
          </Link>
        </div>
      </div>
    </div>
  );
}
