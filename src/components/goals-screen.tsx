"use client";

import { Target } from "lucide-react";
import { formatGBP } from "@/lib/money";
import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { BankingPageIntro } from "@/components/page-intro";
import { EmptyState, PageHeader } from "@/components/ui";

type Goal = { id: string; name: string; targetAmount: string; savedAmount: string };

export function GoalsScreen({ goals }: { goals: Goal[]; accounts: { id: string; name: string }[] }) {
  const { hidden } = useBalancePrivacy();

  return (
    <div className="md:pt-2">
      <PageHeader title="Savings goals" back="/home" />
      <div className="space-y-4 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Goals"
          description="Track progress on savings goals held on your account."
          icon={Target}
          imageSrc="/ui/hero-deposits.svg"
        />
        {goals.length === 0 ? (
          <EmptyState title="No goals yet" body="Savings goals on your account will appear here." />
        ) : (
          goals.map((goal) => {
            const saved = Number(goal.savedAmount);
            const target = Number(goal.targetAmount);
            const width = target === 0 ? 0 : Math.min(100, Math.round((saved / target) * 100));
            return (
              <section key={goal.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-charcoal">{goal.name}</h2>
                  <p className="text-sm text-muted">
                    {hidden ? "£ •••• / £ ••••" : `${formatGBP(goal.savedAmount)} / ${formatGBP(goal.targetAmount)}`}
                  </p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-mist">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${width}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{width}% of target reached</p>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
