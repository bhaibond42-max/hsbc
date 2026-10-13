"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceItem } from "@/lib/services";
import { billPayCategories, demoBranches, depositRatesTable } from "@/lib/explore-visuals";
import { demoStore } from "@/lib/demo-store";
import { USER_PORTAL_VIEW_ONLY } from "@/lib/user-access";
import { api, ApiError } from "@/lib/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { DemoNotice } from "@/components/banking/metrics";
import { RelatedServices } from "@/components/banking/related-links";
import { AllocationChart, PerformanceLineChart } from "@/components/banking/user-charts";
import { Button, Card, EmptyState, ErrorState, SectionHeader, SelectField, TextField } from "@/components/ui";
import { useToast } from "@/components/providers";

function FactsCard({ item }: { item: ServiceItem }) {
  if (item.facts.length === 0) return null;
  return (
    <Card padding="none">
      <dl>
        {item.facts.map((fact) => (
          <div key={fact.label} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
            <dt className="text-sm text-muted">{fact.label}</dt>
            <dd className="text-sm font-medium text-charcoal">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function PrimaryLink({ item }: { item: ServiceItem }) {
  if (item.href.startsWith("/explore/")) return null;
  return (
    <Link href={item.href}>
      <Button type="button" className="w-full">
        Open {item.label}
      </Button>
    </Link>
  );
}

export function LoanCalculatorPanel({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [amount, setAmount] = useState("5000");
  const [months, setMonths] = useState("36");
  const [rate, setRate] = useState("6.9");
  const repayment = useMemo(() => {
    const principal = Number(amount);
    const term = Number(months);
    const apr = Number(rate) / 100 / 12;
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(term) || term <= 0 || !Number.isFinite(apr)) return null;
    const factor = (1 + apr) ** term;
    const pay = (principal * apr * factor) / (factor - 1);
    const total = pay * term;
    return {
      monthly: pay.toLocaleString("en-GB", { style: "currency", currency: "GBP" }),
      total: total.toLocaleString("en-GB", { style: "currency", currency: "GBP" }),
      interest: (total - principal).toLocaleString("en-GB", { style: "currency", currency: "GBP" }),
    };
  }, [amount, months, rate]);

  return (
    <Card className="space-y-3">
      <SectionHeader title="Repayment estimate" description="Illustration only — not an offer or guaranteed rate." />
      <div className={variant === "compact" ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        <TextField label="Amount (£)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField label="Term (months)" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
        <TextField label="APR (%)" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      {repayment ? (
        <dl className="grid gap-2 rounded-md bg-mist p-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Monthly</dt>
            <dd className="text-lg font-semibold tabular-nums">{repayment.monthly}</dd>
          </div>
          <div>
            <dt className="text-muted">Total repayable</dt>
            <dd className="font-semibold tabular-nums">{repayment.total}</dd>
          </div>
          <div>
            <dt className="text-muted">Total interest</dt>
            <dd className="font-semibold tabular-nums">{repayment.interest}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted">Enter valid numbers to see an estimate.</p>
      )}
    </Card>
  );
}

function UpiPanel() {
  const toast = useToast();
  const [vpa, setVpa] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"pay" | "qr">("pay");
  const [history, setHistory] = useState(demoStore.listUpi());
  const saved = ["your.name@bank", "friend@pay"];

  return (
    <div className="space-y-4">
      <DemoNotice>UK bank accounts do not use UPI — this screen simulates the menu for training.</DemoNotice>
      <div className="flex gap-2">
        {(["pay", "qr"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`focus-ring rounded-md px-4 py-2 text-sm font-medium ${tab === id ? "bg-brand text-white" : "border border-line bg-white"}`}
          >
            {id === "pay" ? "Pay" : "Scan QR"}
          </button>
        ))}
      </div>
      {tab === "pay" ? (
        USER_PORTAL_VIEW_ONLY ? (
          <EmptyState title="Payments not available here" body="This app is view-only. Contact HSBC UK to make payments." />
        ) : (
        <Card className="space-y-3">
          <SectionHeader title="Send a UPI payment" description="Stored on this device only." />
          <TextField label="UPI ID" placeholder="name@bank" value={vpa} onChange={(e) => setVpa(e.target.value)} list="upi-saved" required />
          <datalist id="upi-saved">
            {saved.map((id) => (
              <option key={id} value={id} />
            ))}
          </datalist>
          <TextField label="Amount (£)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={40} />
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (!vpa.trim() || !amount.trim()) return;
              demoStore.addUpi({ vpa: vpa.trim(), amount, note });
              setHistory(demoStore.listUpi());
              toast("UPI payment saved");
              setVpa("");
              setAmount("");
              setNote("");
            }}
          >
            Save payment
          </Button>
        </Card>
        )
      ) : (
        <Card className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-40 w-40 place-items-center rounded-lg border-2 border-dashed border-line bg-mist">
            <span className="px-4 text-center text-xs text-muted">QR placeholder — scan would open payee details in a live app</span>
          </div>
          <p className="max-w-sm text-center text-sm text-muted">Generate a QR code from your registered mobile in production banking apps.</p>
        </Card>
      )}
      {history.length === 0 ? (
        <EmptyState title="No UPI payments" body="Saved attempts appear here with status Pending." />
      ) : (
        <Card padding="none">
          <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent</div>
          {history.map((row) => (
            <div key={row.id} className="border-b border-line px-4 py-3 last:border-b-0 text-sm">
              <p className="font-medium">{row.vpa}</p>
              <p className="text-muted">
                £{row.amount} · Pending · {formatDateTime(row.createdAt)}
              </p>
            </div>
          ))}
        </Card>
      )}
      <RelatedServices slug="upi" />
    </div>
  );
}

function RequestMoneyPanel() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Paid">("All");
  const [rows, setRows] = useState(demoStore.listMoneyRequests());
  const visible = rows.filter((row) => filter === "All" || row.status === filter);

  return (
    <div className="space-y-4">
      <DemoNotice />
      {USER_PORTAL_VIEW_ONLY ? null : (
        <Card className="space-y-3">
          <SectionHeader title="Create a request" description="Share your account details separately when the payer is ready." />
          <TextField label="From (name)" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Amount (£)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={18} />
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (!name.trim() || !amount.trim()) return;
              demoStore.addMoneyRequest({ name: name.trim(), amount, reference });
              setRows(demoStore.listMoneyRequests());
              toast("Request created");
            }}
          >
            Create request
          </Button>
        </Card>
      )}
      <div className="flex flex-wrap gap-2">
        {(["All", "Pending", "Paid"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === id ? "bg-charcoal text-white" : "bg-mist"}`}
          >
            {id}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No requests" body="Create a request or change the filter." />
      ) : (
        <Card padding="none">
          {visible.map((row) => (
            <div key={row.id} className="flex justify-between border-b border-line px-4 py-3 last:border-b-0 text-sm">
              <span>
                {row.name} · £{row.amount}
                <span className="block text-xs text-muted">{row.reference || "No reference"}</span>
              </span>
              <span className="text-muted">{row.status}</span>
            </div>
          ))}
        </Card>
      )}
      <Link href="/payments?mode=receive">
        <Button type="button" variant="secondary" className="w-full">
          Share account details instead
        </Button>
      </Link>
      <RelatedServices slug="request-money" />
    </div>
  );
}

function StandingOrderPanel() {
  const [rows, setRows] = useState<{ id: string; payeeName: string; amount: string; nextDate: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ payments: { id: string; payeeName: string; amount: string; nextDate: string }[] }>("/api/scheduled")
      .then((data) => setRows(data.payments))
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Could not load standing orders"));
  }, []);

  return (
    <div className="space-y-4">
      <DemoNotice>Creating standing orders to external payees may not be available on savings accounts.</DemoNotice>
      {error ? <ErrorState message={error} /> : null}
      {rows.length === 0 ? (
        <EmptyState title="No standing orders" body="When scheduled payments exist in the database, they appear here with next execution dates." />
      ) : (
        <Card padding="none">
          {rows.map((row) => (
            <div key={row.id} className="border-b border-line px-4 py-3 last:border-b-0 text-sm">
              <p className="font-medium">{row.payeeName}</p>
              <p className="text-muted">
                £{row.amount} · Next {formatDate(row.nextDate)}
              </p>
            </div>
          ))}
        </Card>
      )}
      <Card className="space-y-2 text-sm text-muted">
        <p className="font-medium text-charcoal">How standing orders work</p>
        <p>Choose a payee, amount, and start date. The same payment is sent automatically until you cancel or change it.</p>
      </Card>
      <Link href="/payments?mode=transfer">
        <Button type="button" variant="secondary" className="w-full">
          Transfer between own accounts
        </Button>
      </Link>
      <RelatedServices slug="standing-order" />
    </div>
  );
}

function BillPayPanel() {
  const [query, setQuery] = useState("");
  const filtered = billPayCategories.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-4">
      <DemoNotice>Bill pay is linked to your direct debits and saved payees.</DemoNotice>
      <TextField label="Search categories" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Electricity, mobile…" />
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((cat) => (
          <Card key={cat.id} padding="sm" className="space-y-1">
            <p className="font-medium text-charcoal">{cat.label}</p>
            <p className="text-xs text-muted">{cat.hint}</p>
            <Link href="/direct-debits" className="text-sm font-semibold text-brand hover:underline">
              Manage direct debits
            </Link>
          </Card>
        ))}
      </div>
      <Link href="/direct-debits">
        <Button type="button" className="w-full">
          View upcoming collections
        </Button>
      </Link>
      <RelatedServices slug="bill-pay" />
    </div>
  );
}

function InternationalPanel() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("EUR");
  const rates: Record<string, { rate: number; fee: string }> = {
    EUR: { rate: 1.18, fee: "£0.00" },
    USD: { rate: 1.32, fee: "£0.00" },
    AED: { rate: 4.85, fee: "£4.00" },
    INR: { rate: 110.4, fee: "£5.00" },
  };
  const selected = rates[currency] ?? rates.EUR;
  const converted = Number(amount) * selected.rate;

  return (
    <div className="space-y-4">
      <DemoNotice>Indicative rates for layout only — not a live quote.</DemoNotice>
      <p className="text-sm text-muted">Cut-off 15:00 UK · fee {selected.fee} (illustrative)</p>
      <Card className="space-y-3">
        <SectionHeader title="Estimate conversion" description="Final rate is confirmed on the review screen in live banking." />
        <TextField label="You send (£)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <SelectField label="They receive" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {Object.keys(rates).map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </SelectField>
        <p className="text-2xl font-semibold tabular-nums">
          {Number.isFinite(converted) ? converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}{" "}
          {currency}
        </p>
        <p className="text-xs text-muted">Estimated arrival: 1–3 working days (illustrative)</p>
      </Card>
      <Link href="/rates">
        <Button type="button" className="w-full">
          Open full rates table
        </Button>
      </Link>
      <RelatedServices slug="international" />
    </div>
  );
}

function WatchlistPanel() {
  const samples = [
    { symbol: "HSBA", name: "HSBC Holdings (illustrative)" },
    { symbol: "FTSE", name: "FTSE 100 tracker (illustrative)" },
    { symbol: "GILT", name: "UK Gilt fund (illustrative)" },
  ];
  const [list, setList] = useState(demoStore.listWatchlist());
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <DemoNotice>Prices and performance are not live market data.</DemoNotice>
      <TextField label="Search assets" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Symbol or name" />
      {list.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 p-6">
          <Image src="/ui/empty-watchlist.svg" alt="" width={160} height={112} />
          <EmptyState title="Watchlist is empty" body="Add illustrative assets below to practice the layout." />
        </div>
      ) : (
        <Card padding="none">
          {list.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-line px-4 py-3 last:border-b-0 text-sm">
              <span>
                {item.name}
                <span className="block text-xs text-muted">{item.symbol} · Indicative</span>
              </span>
              {USER_PORTAL_VIEW_ONLY ? null : (
                <Button type="button" variant="ghost" onClick={() => { demoStore.toggleWatch(item.symbol, item.name); setList(demoStore.listWatchlist()); }}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
      <Card padding="none">
        {samples
          .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.symbol.toLowerCase().includes(search.toLowerCase()))
          .map((sample) => {
            const watched = list.some((item) => item.symbol === sample.symbol);
            return (
              <div key={sample.symbol} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{sample.name}</p>
                  <p className="text-xs text-muted">{sample.symbol} · No live price</p>
                </div>
                {USER_PORTAL_VIEW_ONLY ? (
                  <span className="text-xs text-muted">{watched ? "On list" : "—"}</span>
                ) : (
                  <Button
                    type="button"
                    variant={watched ? "primary" : "secondary"}
                    onClick={() => {
                      demoStore.toggleWatch(sample.symbol, sample.name);
                      setList(demoStore.listWatchlist());
                    }}
                  >
                    {watched ? "Watching" : "Watch"}
                  </Button>
                )}
              </div>
            );
          })}
      </Card>
      <RelatedServices slug="watchlist" />
    </div>
  );
}

function ChequeBookPanel() {
  const toast = useToast();
  const [leaves, setLeaves] = useState("25");
  const [address, setAddress] = useState("");
  const [orders, setOrders] = useState(demoStore.listCheques());
  return (
    <div className="space-y-4">
      <DemoNotice />
      <p className="text-sm text-muted">Delivery about 5 working days · fee £0 (illustrative)</p>
      {USER_PORTAL_VIEW_ONLY ? null : (
        <Card className="space-y-3">
          <SectionHeader title="Order cheque book" description="Submitted for processing from this device." />
          <SelectField label="Cheque leaves" value={leaves} onChange={(e) => setLeaves(e.target.value)}>
            <option value="25">25 leaves</option>
            <option value="50">50 leaves</option>
          </SelectField>
          <TextField label="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (!address.trim()) return;
              demoStore.addCheque({ leaves, address: address.trim() });
              setOrders(demoStore.listCheques());
              toast("Cheque order submitted");
            }}
          >
            Submit order
          </Button>
        </Card>
      )}
      {orders.length === 0 ? (
        <EmptyState title="No orders" body="Previous cheque book requests appear here." />
      ) : (
        orders.map((order) => (
          <Card key={order.id} padding="sm">
            <p className="text-sm font-medium">{order.status}</p>
            <p className="text-xs text-muted">
              {order.leaves} leaves · {order.address}
            </p>
          </Card>
        ))
      )}
      <RelatedServices slug="cheque-book" />
    </div>
  );
}

function InvestmentPanel({ item }: { item: ServiceItem }) {
  const allocation = [
    { name: "Equities", pct: 45 },
    { name: "Bonds", pct: 30 },
    { name: "Cash", pct: 25 },
  ];
  const performance = [
    { label: "1M", value: 0.4 },
    { label: "3M", value: 1.2 },
    { label: "6M", value: -0.3 },
    { label: "1Y", value: 2.1 },
  ];
  return (
    <div className="space-y-4">
      <DemoNotice>No holdings are connected — tables show sample layout rows only.</DemoNotice>
      <FactsCard item={item} />
      <Card padding="md">
        <SectionHeader title="Sample holdings table" description="Illustrative columns — not your real portfolio." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Asset</th>
                <th className="py-2 pr-4">Quantity</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2">Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  No holdings — connect an investment service in production.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      {item.slug === "portfolio" || item.slug === "funds" ? (
        <Card padding="md">
          <SectionHeader title="Sample allocation (illustrative)" />
          <AllocationChart rows={allocation} />
        </Card>
      ) : null}
      {item.slug === "stocks" || item.slug === "portfolio" ? (
        <Card padding="md">
          <SectionHeader title="Sample performance (illustrative)" />
          <PerformanceLineChart rows={performance} />
        </Card>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/explore/watchlist">
          <Button type="button" variant="secondary" className="w-full">
            Open watchlist
          </Button>
        </Link>
        <Link href="/insights">
          <Button type="button" variant="secondary" className="w-full">
            Spending insights
          </Button>
        </Link>
      </div>
      <RelatedServices slug={item.slug} />
    </div>
  );
}

function LoanProductPanel({ item }: { item: ServiceItem }) {
  const showCalc = ["personal-loan", "home-loan", "car-loan", "loan-calculator"].includes(item.slug);
  const schedules =
    item.slug === "repayments"
      ? []
      : [
          { date: "2026-11-01", amount: "£0.00", status: "Nothing due" },
        ];

  return (
    <div className="space-y-4">
      <DemoNotice />
      <FactsCard item={item} />
      <p className="text-sm text-muted">Illustrative APR 6.9% — not an offer</p>
      {showCalc ? <LoanCalculatorPanel /> : null}
      {item.slug === "overdraft" ? (
        <Card className="space-y-3">
          <SectionHeader title="Overdraft limit" description="Utilisation bar updates when a limit is arranged." />
          <div className="h-2 rounded-full bg-mist">
            <div className="h-full w-0 rounded-full bg-brand" />
          </div>
          <p className="text-sm text-muted">Used £0.00 of £0.00 arranged overdraft.</p>
        </Card>
      ) : null}
      {item.slug === "repayments" ? (
        <Card padding="none">
          <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase text-muted">Upcoming</div>
          <p className="px-4 py-6 text-sm text-muted">No repayments scheduled — open a loan product to see a schedule here.</p>
        </Card>
      ) : (
        schedules.length > 0 && (
          <Card padding="none">
            {schedules.map((row) => (
              <div key={row.date} className="flex justify-between border-b border-line px-4 py-3 text-sm last:border-b-0">
                <span>{formatDate(row.date)}</span>
                <span className="font-medium">{row.amount}</span>
                <span className="text-muted">{row.status}</span>
              </div>
            ))}
          </Card>
        )
      )}
      <Link href="/help">
        <Button type="button" variant="secondary" className="w-full">
          Help and eligibility
        </Button>
      </Link>
      <RelatedServices slug={item.slug} />
    </div>
  );
}

function DepositPanel({ item }: { item: ServiceItem }) {
  const [query, setQuery] = useState("");
  const rows = depositRatesTable.filter(
    (row) =>
      row.product.toLowerCase().includes(query.toLowerCase()) ||
      row.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <DemoNotice>Rates shown are illustrative and may differ from current HSBC UK product rates.</DemoNotice>
      <FactsCard item={item} />
      {item.slug === "deposit-rates" || item.slug === "fixed-deposit" ? (
        <>
          <TextField label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Card padding="none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist/50 text-left text-xs uppercase text-muted">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2 hidden sm:table-cell">Term</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.product}</p>
                      <p className="text-xs text-muted">{row.category} · Min {row.min}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand">{row.rate}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{row.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
      {item.slug === "cash-isa" ? (
        <Card className="space-y-2 text-sm">
          <p className="font-medium">ISA allowance (current tax year)</p>
          <p className="text-muted">Annual subscription limit shown in facts — verify against HMRC rules for real applications.</p>
          <div className="h-2 rounded-full bg-mist">
            <div className="h-full w-[15%] rounded-full bg-brand" title="Illustrative contributions" />
          </div>
          <p className="text-xs text-muted">Illustrative progress — not your actual ISA usage.</p>
        </Card>
      ) : null}
      <PrimaryLink item={item} />
      <RelatedServices slug={item.slug} />
    </div>
  );
}

function CardServicePanel({ item }: { item: ServiceItem }) {
  return (
    <div className="space-y-4">
      <FactsCard item={item} />
      {item.slug === "card-pin" ? (
        <Card padding="md" className="space-y-2">
          <SectionHeader title="PIN management" description="Your PIN is never shown in digital banking." />
          <ul className="list-inside list-disc text-sm text-muted">
            <li>Change PIN at an HSBC UK cash machine</li>
            <li>After 3 incorrect tries, the PIN may be blocked</li>
            <li>Never share your PIN with anyone</li>
          </ul>
        </Card>
      ) : null}
      {item.slug === "card-offers" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {["Dining", "Travel", "Shopping"].map((cat) => (
            <Card key={cat} padding="sm" className="space-y-2">
              <div className="h-20 rounded-md bg-gradient-to-br from-brand-soft to-mist" aria-hidden />
              <p className="font-medium">{cat} offers</p>
              <p className="text-xs text-muted">No active offers at the moment.</p>
            </Card>
          ))}
        </div>
      ) : null}
      {item.slug === "card-limits" ? (
        <Card className="space-y-3">
          <SectionHeader title="Daily limit utilisation" />
          <div className="h-2 rounded-full bg-mist">
            <div className="h-full w-[32%] rounded-full bg-brand" />
          </div>
          <p className="text-sm text-muted">£160.00 of £500.00 illustrative daily limit used.</p>
        </Card>
      ) : null}
      {item.action ? (
        <Link href={item.action.href}>
          <Button type="button" className="w-full">
            {item.action.label}
          </Button>
        </Link>
      ) : (
        <PrimaryLink item={item} />
      )}
      <RelatedServices slug={item.slug} />
    </div>
  );
}

function DocumentsPanel() {
  const [query, setQuery] = useState("");
  const docs = [
    { name: "Terms summary.pdf", type: "PDF", size: "124 KB" },
    { name: "Fee schedule (illustrative).pdf", type: "PDF", size: "98 KB" },
  ];
  const filtered = docs.filter((doc) => doc.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-4">
      <DemoNotice>Downloads are placeholders — files are not stored on server in this build.</DemoNotice>
      <TextField label="Search documents" placeholder="Name or type" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((doc) => (
          <Card key={doc.name} padding="sm" className="flex gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-brand-soft text-xs font-bold text-brand">PDF</div>
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted">
                {doc.type} · {doc.size}
              </p>
              <button type="button" className="mt-1 text-sm font-semibold text-brand" disabled>
                Download
              </button>
            </div>
          </Card>
        ))}
      </div>
      <RelatedServices slug="documents" />
    </div>
  );
}

function BranchesPanel() {
  const [q, setQ] = useState("");
  const list = demoBranches.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()) || b.address.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <DemoNotice>Branch data is sample content for layout — verify on hsbc.co.uk for real branches.</DemoNotice>
      <TextField label="Find a branch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="City or postcode" />
      {list.map((branch) => (
        <Card key={branch.name} padding="md" className="space-y-2">
          <p className="font-semibold text-charcoal">{branch.name}</p>
          <p className="text-sm text-muted">{branch.address}</p>
          <p className="text-xs text-muted">{branch.hours}</p>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" disabled>
              Directions
            </Button>
            <Button type="button" variant="ghost" disabled>
              Call
            </Button>
          </div>
        </Card>
      ))}
      <RelatedServices slug="branches" />
    </div>
  );
}

function DefaultPanel({ item }: { item: ServiceItem }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{item.summary}</p>
      <FactsCard item={item} />
      {item.calculator ? <LoanCalculatorPanel /> : null}
      {item.action ? (
        <Link href={item.action.href}>
          <Button type="button" className="w-full">
            {item.action.label}
          </Button>
        </Link>
      ) : (
        <PrimaryLink item={item} />
      )}
      {item.slug === "international" ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/rates")}>
          View exchange rates
        </Button>
      ) : null}
      <RelatedServices slug={item.slug} />
    </div>
  );
}

export function ExploreContent({ item }: { item: ServiceItem }) {
  if (item.slug === "upi") return <UpiPanel />;
  if (item.slug === "request-money") return <RequestMoneyPanel />;
  if (item.slug === "standing-order") return <StandingOrderPanel />;
  if (item.slug === "bill-pay") return <BillPayPanel />;
  if (item.slug === "international") return <InternationalPanel />;
  if (item.slug === "watchlist") return <WatchlistPanel />;
  if (item.slug === "cheque-book") return <ChequeBookPanel />;
  if (item.slug === "loan-calculator") return <LoanCalculatorPanel />;
  if (["personal-loan", "home-loan", "car-loan", "overdraft", "repayments"].includes(item.slug)) {
    return <LoanProductPanel item={item} />;
  }
  if (["stocks", "funds", "isa", "bonds", "portfolio"].includes(item.slug)) {
    return <InvestmentPanel item={item} />;
  }
  if (["savings", "fixed-deposit", "notice-account", "cash-isa", "premier-saver", "deposit-rates"].includes(item.slug)) {
    return <DepositPanel item={item} />;
  }
  if (["debit-card", "card-controls", "card-limits", "card-pin", "card-statements", "card-offers"].includes(item.slug)) {
    return <CardServicePanel item={item} />;
  }
  if (item.slug === "documents") return <DocumentsPanel />;
  if (item.slug === "branches") return <BranchesPanel />;
  return <DefaultPanel item={item} />;
}
