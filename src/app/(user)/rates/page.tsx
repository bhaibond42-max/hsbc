"use client";

import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import { depositRatesTable } from "@/lib/explore-visuals";
import { formatGBP } from "@/lib/money";
import { BankingPageIntro } from "@/components/page-intro";
import { PageHeader, SectionHeader, TextField } from "@/components/ui";

const FX_RATES = [
  { code: "EUR", name: "Euro", rate: 1.18 },
  { code: "USD", name: "US dollar", rate: 1.32 },
  { code: "AED", name: "UAE dirham", rate: 4.85 },
  { code: "INR", name: "Indian rupee", rate: 110.4 },
];

export default function RatesPage() {
  const [pounds, setPounds] = useState("100");
  const [code, setCode] = useState("EUR");
  const [productQuery, setProductQuery] = useState("");
  const selected = FX_RATES.find((rate) => rate.code === code) ?? FX_RATES[0];
  const converted = useMemo(() => {
    const value = Number(pounds);
    if (!Number.isFinite(value) || value < 0) return null;
    return (value * selected.rate).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [pounds, selected]);

  const products = depositRatesTable.filter(
    (row) =>
      row.product.toLowerCase().includes(productQuery.toLowerCase()) ||
      row.category.toLowerCase().includes(productQuery.toLowerCase()),
  );

  return (
    <div className="md:pt-2">
      <PageHeader title="Rates" back="/home" />
      <div className="space-y-6 px-4 pb-10 md:px-0">
        <BankingPageIntro
          title="Interest & FX rates"
          description="Compare saver rates and convert pounds using indicative exchange rates."
          icon={Percent}
          imageSrc="/ui/hero-deposits.svg"
        />
        <p className="text-sm text-muted">Indicative rates · updated Oct 2026</p>
        <section className="panel p-4">
          <SectionHeader title="Currency converter" description="Illustrative HSBC UK-style rates." />
          <label className="block text-sm font-medium">
            Amount in pounds
            <input
              value={pounds}
              onChange={(event) => setPounds(event.target.value)}
              inputMode="decimal"
              className="mt-1 h-11 w-full rounded-md border border-line px-3"
            />
          </label>
          <label className="mt-3 block text-sm font-medium">
            Currency
            <select value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-line px-3">
              {FX_RATES.map((rate) => (
                <option key={rate.code} value={rate.code}>
                  {rate.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-sm text-muted">{Number.isFinite(Number(pounds)) ? formatGBP(Number(pounds).toFixed(2)) : "£0.00"} converts to</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {converted ?? "—"} {selected.code}
          </p>
        </section>
        <ul className="panel overflow-hidden p-0">
          {FX_RATES.map((rate) => (
            <li key={rate.code} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
              <span>
                <span className="block text-sm font-medium">{rate.code}</span>
                <span className="text-xs text-muted">{rate.name}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{rate.rate.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <section className="panel p-4">
          <SectionHeader title="Savings interest rates" description="Search and compare available products." />
          <TextField label="Search products" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="ISA, fixed…" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase text-muted">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2 pr-4">Min</th>
                  <th className="py-2">Term</th>
                </tr>
              </thead>
              <tbody>
                {products.map((row) => (
                  <tr key={row.product} className="border-b border-line last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{row.product}</p>
                      <p className="text-xs text-muted">{row.category}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-brand">{row.rate}</td>
                    <td className="py-3 pr-4 text-muted">{row.min}</td>
                    <td className="py-3 text-muted">{row.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
