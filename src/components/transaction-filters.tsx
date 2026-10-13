"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { CATEGORIES } from "@/lib/constants";
import { Card, SelectField, TextField } from "./ui";

export function TransactionFilters({ accounts }: { accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [advanced, setAdvanced] = useState(
    Boolean(params.get("accountId") || params.get("category") || params.get("from") || params.get("to") || params.get("min") || params.get("max")),
  );
  const [query, setQuery] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "ALL") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  const view = params.get("view") ?? "ALL";
  const views = [
    ["ALL", "All"],
    ["IN", "Money in"],
    ["OUT", "Money out"],
    ["PENDING", "Pending"],
  ] as const;

  return (
    <Card padding="sm" className="space-y-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or reference"
          aria-label="Search transactions"
          className="focus-ring h-11 w-full rounded-md border border-line bg-mist pl-10 pr-3 text-sm text-charcoal placeholder:text-muted focus:border-brand"
          onKeyDown={(event) => {
            if (event.key === "Enter") setParam("q", query.trim());
          }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {views.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setParam("view", value)}
            className={clsx(
              "focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              view === value ? "bg-brand text-white shadow-sm" : "bg-mist text-charcoal hover:bg-brand-soft/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((open) => !open)}
        className="focus-ring flex w-full items-center justify-between rounded-md border border-line bg-mist px-3 py-2.5 text-sm font-medium text-charcoal"
        aria-expanded={advanced}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Refine search
        </span>
        <ChevronDown size={18} className={clsx("transition-transform", advanced && "rotate-180")} />
      </button>

      {advanced ? (
        <div className="space-y-3 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Account"
              defaultValue={params.get("accountId") ?? ""}
              onChange={(event) => setParam("accountId", event.target.value)}
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Category"
              defaultValue={params.get("category") ?? ""}
              onChange={(event) => setParam("category", event.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </SelectField>
            <TextField
              label="From"
              type="date"
              defaultValue={params.get("from") ?? ""}
              onChange={(event) => setParam("from", event.target.value)}
            />
            <TextField
              label="To"
              type="date"
              defaultValue={params.get("to") ?? ""}
              onChange={(event) => setParam("to", event.target.value)}
            />
            <TextField
              label="Min amount (£)"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={params.get("min") ?? ""}
              onBlur={(event) => setParam("min", event.target.value.trim())}
            />
            <TextField
              label="Max amount (£)"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={params.get("max") ?? ""}
              onBlur={(event) => setParam("max", event.target.value.trim())}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
