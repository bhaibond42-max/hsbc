/** Client-only demo records — not real banking data. */

import { USER_PORTAL_VIEW_ONLY } from "@/lib/user-access";

export type DemoRecord = { id: string; createdAt: string };

export type DemoUpiRequest = DemoRecord & { vpa: string; amount: string; note: string };
export type DemoMoneyRequest = DemoRecord & { name: string; amount: string; reference: string; status: "Pending" | "Paid" };
export type DemoChequeOrder = DemoRecord & { leaves: string; address: string; status: "Submitted" };
export type DemoWatchItem = DemoRecord & { symbol: string; name: string };

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  if (USER_PORTAL_VIEW_ONLY) return;
  localStorage.setItem(key, JSON.stringify(items));
}

const keys = {
  upi: "hsbc-demo-upi",
  moneyRequest: "hsbc-demo-money-request",
  cheque: "hsbc-demo-cheque",
  watchlist: "hsbc-demo-watchlist",
  payeeDraft: "hsbc-demo-payee-drafts",
} as const;

export type DemoPayeeDraft = DemoRecord & { name: string; sortCode: string; accountNumber: string };

export const demoStore = {
  listUpi: () => read<DemoUpiRequest>(keys.upi),
  addUpi: (entry: Omit<DemoUpiRequest, "id" | "createdAt">) => {
    const next = [{ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...read<DemoUpiRequest>(keys.upi)];
    write(keys.upi, next.slice(0, 20));
  },
  listMoneyRequests: () => read<DemoMoneyRequest>(keys.moneyRequest),
  addMoneyRequest: (entry: Omit<DemoMoneyRequest, "id" | "createdAt" | "status">) => {
    const row: DemoMoneyRequest = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "Pending" };
    write(keys.moneyRequest, [row, ...read<DemoMoneyRequest>(keys.moneyRequest)].slice(0, 20));
  },
  listCheques: () => read<DemoChequeOrder>(keys.cheque),
  addCheque: (entry: Omit<DemoChequeOrder, "id" | "createdAt" | "status">) => {
    const row: DemoChequeOrder = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "Submitted" };
    write(keys.cheque, [row, ...read<DemoChequeOrder>(keys.cheque)].slice(0, 10));
  },
  listWatchlist: () => read<DemoWatchItem>(keys.watchlist),
  toggleWatch: (symbol: string, name: string) => {
    const current = read<DemoWatchItem>(keys.watchlist);
    const exists = current.find((item) => item.symbol === symbol);
    const next = exists
      ? current.filter((item) => item.symbol !== symbol)
      : [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), symbol, name }, ...current];
    write(keys.watchlist, next.slice(0, 30));
    return !exists;
  },
  listPayeeDrafts: () => read<DemoPayeeDraft>(keys.payeeDraft),
  addPayeeDraft: (entry: Omit<DemoPayeeDraft, "id" | "createdAt">) => {
    const row: DemoPayeeDraft = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(keys.payeeDraft, [row, ...read<DemoPayeeDraft>(keys.payeeDraft)].slice(0, 20));
  },
};
