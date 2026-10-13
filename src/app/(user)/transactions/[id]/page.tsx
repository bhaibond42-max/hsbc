import { notFound } from "next/navigation";
import { formatDateLong, formatTime, humanise } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { isStaffBankSideTransaction } from "@/lib/staff-bank-transactions";
import { requireUserPage } from "@/server/auth";
import { getOwnedTransaction } from "@/server/queries";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUserPage();
  const txn = await getOwnedTransaction(session.user.id, id);
  if (!txn) notFound();
  const hidden = session.user.hideBalances;
  const amount = hidden ? "£ ••••••" : `${txn.type === "DEBIT" ? "-" : "+"}${formatGBP(txn.amount.toString())}`;
  const rows = [
    ["Status", humanise(txn.status)],
    ["Type", txn.type === "CREDIT" ? "Money in" : "Money out"],
    ["Date", formatDateLong(txn.transactionDate)],
    ["Time", formatTime(txn.transactionDate)],
    ["Reference", txn.reference],
    ["Account", txn.account.name],
    ["Balance after", hidden ? "£ ••••••" : formatGBP(txn.balanceAfter.toString())],
    ["Category", txn.category],
    ...(txn.notes && !isStaffBankSideTransaction({ merchant: txn.merchant, description: txn.description })
      ? [["Notes", txn.notes] as const]
      : []),
  ];
  return (
    <div>
      <PageHeader title="Transaction" back="/transactions" />
      <div className="px-5">
        <section className="rounded-2xl bg-white px-5 py-6 text-center ring-1 ring-line">
          <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500">{(txn.merchant || txn.description).toUpperCase()}</p>
          <p className="mt-2 text-sm text-neutral-500">{txn.description}</p>
          <p className={`mt-4 text-4xl font-semibold tracking-tight ${txn.type === "CREDIT" ? "text-emerald-700" : ""}`}>{amount}</p>
          <div className="mt-3">
            <StatusBadge status={txn.status} />
          </div>
        </section>
        <section className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0">
              <span className="text-sm text-neutral-500">{label}</span>
              <span className="text-right text-sm font-medium">{value}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
