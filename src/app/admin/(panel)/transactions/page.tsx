import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { transactionQuerySchema } from "@/lib/validation";
import { requireAdminPage } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";
import { StatusBadge } from "@/components/ui";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsed = transactionQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : { page: 1, pageSize: 20 };
  const result = await queryTransactions(query);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <form className="my-4 flex flex-wrap gap-2" action="/admin/transactions">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Search" className="h-11 min-w-48 flex-1 rounded-lg border border-line bg-white px-3 text-sm" />
        <select name="type" defaultValue={query.type ?? ""} className="h-11 rounded-lg border border-line bg-white px-2 text-sm">
          <option value="">All types</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>
        <select name="status" defaultValue={query.status ?? ""} className="h-11 rounded-lg border border-line bg-white px-2 text-sm">
          <option value="">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="REVERSED">Reversed</option>
          <option value="FAILED">Failed</option>
        </select>
        <button className="h-11 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((txn) => {
              const view = serializeTxn(txn);
              return (
                <tr key={view.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(view.transactionDate)}</td>
                  <td className="px-4 py-3">
                    {view.ownerId ? <Link href={`/admin/users/${view.ownerId}`} className="font-medium text-brand">{view.ownerName}</Link> : view.ownerName}
                  </td>
                  <td className="px-4 py-3">
                    <p>{view.description}</p>
                    <p className="text-xs text-neutral-500">{view.reference}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{view.type === "DEBIT" ? "-" : "+"}{formatGBP(view.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={view.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
