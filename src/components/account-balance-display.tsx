"use client";

import { formatGBP } from "@/lib/money";
import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { StatusBadge } from "@/components/ui";

export function AccountBalanceDisplay({
  available,
  current,
  status,
}: {
  available: string;
  current: string;
  status: string;
}) {
  const { hidden } = useBalancePrivacy();
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Available balance</p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-tight">
        {hidden ? "£ ••••••" : formatGBP(available)}
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Current balance {hidden ? "£ ••••••" : formatGBP(current)}
      </p>
    </section>
  );
}
