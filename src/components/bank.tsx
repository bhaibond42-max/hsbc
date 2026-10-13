"use client";

import Link from "next/link";
import { clsx } from "clsx";
import {
  ArrowLeftRight,
  Coffee,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Home,
  Receipt,
  Repeat,
  ShoppingBag,
  Smartphone,
  Train,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatDateShort, humanise } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { StatusBadge } from "./ui";

const icons: Record<string, LucideIcon> = {
  Groceries: ShoppingBag,
  Salary: Wallet,
  "Eating out": Coffee,
  Bills: Receipt,
  Rent: Home,
  Subscriptions: Smartphone,
  Shopping: ShoppingBag,
  Transport: Train,
  Entertainment: Smartphone,
  Transfer: ArrowLeftRight,
  Refund: Repeat,
  Cash: Wallet,
  Adjustment: Receipt,
  Reversal: Repeat,
};

export function CurrencyAmount({
  amount,
  type,
  hidden,
  size = "sm",
}: {
  amount: string;
  type?: "CREDIT" | "DEBIT";
  hidden?: boolean;
  size?: "sm" | "lg" | "xl";
}) {
  const text = hidden
    ? "£ ••••••"
    : type === "DEBIT"
      ? `-${formatGBP(amount)}`
      : type === "CREDIT"
        ? `+${formatGBP(amount)}`
        : formatGBP(amount);
  return (
    <span
      className={
        size === "xl"
          ? "text-4xl font-semibold tracking-tight text-neutral-950"
          : size === "lg"
            ? "text-2xl font-semibold tracking-tight"
            : type === "CREDIT"
              ? "text-sm font-semibold text-emerald-700"
              : "text-sm font-semibold text-neutral-950"
      }
    >
      {text}
    </span>
  );
}

export function BalanceCard({
  name,
  amount,
  current,
  status,
  hidden,
  onToggle,
  href,
}: {
  name: string;
  amount: string;
  current: string;
  masked?: string;
  status: string;
  hidden: boolean;
  onToggle?: () => void;
  href: string;
}) {
  return (
    <section className="panel relative overflow-hidden p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />
      <div className="flex items-start justify-between pl-2">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted">{name.toUpperCase()}</p>
          <p className="mt-1 text-xs text-muted">{humanise(status)}</p>
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="press grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-700"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        ) : null}
      </div>
      <div className="mt-4 pl-2">
        <CurrencyAmount amount={amount} hidden={hidden} size="xl" />
        <p className="mt-1 text-sm text-muted">Available balance</p>
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-line pt-4 pl-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Current balance</p>
          <p className="mt-0.5 text-sm font-medium">{hidden ? "£ ••••••" : formatGBP(current)}</p>
        </div>
        <Link href={href} className="focus-ring rounded-sm text-sm font-semibold text-brand hover:underline">
          View account
        </Link>
      </div>
    </section>
  );
}

export function QuickActions() {
  const items = [
    { href: "/payments", label: "Pay", icon: Receipt },
    { href: "/payments?mode=transfer", label: "Transfer", icon: ArrowLeftRight },
    { href: "/payments?mode=receive", label: "Receive", icon: Wallet },
    { href: "/cards", label: "Cards", icon: CreditCard },
    { href: "/statements", label: "Statements", icon: FileText },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="press focus-ring flex flex-col items-center gap-2.5 rounded-md py-1 text-center transition-colors hover:bg-brand-soft/60"
        >
          <span className="grid h-14 w-14 place-items-center rounded-lg border border-line bg-surface text-brand sm:h-[3.75rem] sm:w-[3.75rem]">
            <item.icon size={24} strokeWidth={1.75} />
          </span>
          <span className="text-xs font-medium text-charcoal">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function TransactionItem({
  id,
  title,
  category,
  date,
  amount,
  type,
  status,
  hidden,
  grouped = false,
}: {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: string;
  hidden?: boolean;
  grouped?: boolean;
}) {
  const Icon = icons[category] ?? Receipt;
  const showStatus = status !== "COMPLETED";
  const iconWrap =
    type === "CREDIT" ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-brand-soft text-brand ring-red-100";
  return (
    <Link
      href={`/transactions/${id}`}
      className="press focus-ring flex items-center gap-3 px-4 py-4 transition-colors hover:bg-brand-soft/25"
    >
      <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1", iconWrap)}>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-charcoal">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">
          {grouped ? category : `${formatDateShort(date)} · ${category}`}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <CurrencyAmount amount={amount} type={type} hidden={hidden} size="lg" />
        {showStatus ? (
          <span className="mt-1.5 block">
            <StatusBadge status={status} />
          </span>
        ) : null}
      </span>
    </Link>
  );
}
