import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUserPage } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";
import { AccountBalanceDisplay } from "@/components/account-balance-display";
import { PageHeader } from "@/components/ui";
import { AccountTransactionsList } from "@/components/account-transactions-list";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUserPage();
  const account = await prisma.account.findFirst({ where: { id, userId: session.user.id } });
  if (!account) notFound();
  const txns = await queryTransactions({ accountId: account.id, page: 1, pageSize: 8 }, session.user.id);
  const rows = [
    ["Account type", "Savings account"],
    ["Currency", account.currency],
    ["Opened", formatDate(account.createdAt)],
  ];
  return (
    <div>
      <PageHeader title={account.name} back="/accounts" />
      <div className="space-y-4 px-5">
        <AccountBalanceDisplay
          available={account.availableBalance.toString()}
          current={account.currentBalance.toString()}
          status={account.status}
        />
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
              <span className="text-sm text-neutral-500">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </section>
        <Link href={`/statements?accountId=${account.id}`} className="block rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white">
          View statement
        </Link>
        <section>
          <h2 className="mb-2 text-base font-semibold">Recent activity</h2>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            <AccountTransactionsList
              items={txns.items.map((txn) => {
                const view = serializeTxn(txn);
                return {
                  id: view.id,
                  title: view.merchant || view.description,
                  category: view.category,
                  date: view.transactionDate,
                  amount: view.amount,
                  type: view.type,
                  status: view.status,
                };
              })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
