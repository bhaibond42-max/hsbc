import { Suspense } from "react";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/db";
import { transactionQuerySchema } from "@/lib/validation";
import { requireUserPage } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";
import { BankingPageIntro } from "@/components/page-intro";
import { TransactionListGrouped } from "@/components/transaction-list";
import { TransactionFilters } from "@/components/transaction-filters";
import { PageHeader } from "@/components/ui";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireUserPage();
  const raw = await searchParams;
  const view = typeof raw.view === "string" ? raw.view : "ALL";
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && key !== "view") flat[key] = value;
  }
  if (view === "IN") flat.type = "CREDIT";
  if (view === "OUT") flat.type = "DEBIT";
  if (view === "PENDING" || view === "COMPLETED" || view === "REVERSED") flat.status = view;
  const parsed = transactionQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : { page: 1, pageSize: 20 };
  const result = await queryTransactions(query, session.user.id);
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

  const rows = result.items.map((txn) => {
    const viewTxn = serializeTxn(txn);
    return {
      id: viewTxn.id,
      title: viewTxn.merchant || viewTxn.description,
      category: viewTxn.category,
      transactionDate: viewTxn.transactionDate,
      amount: viewTxn.amount,
      type: viewTxn.type,
      status: viewTxn.status,
    };
  });

  const prevHref = page > 1 ? `?${new URLSearchParams({ ...flat, page: String(page - 1) })}` : null;
  const nextHref = page * pageSize < result.total ? `?${new URLSearchParams({ ...flat, page: String(page + 1) })}` : null;

  return (
    <div className="md:pt-2">
      <PageHeader title="Transactions" />
      <div className="space-y-5 px-4 md:px-0">
        <BankingPageIntro
          title="Activity history"
          description="Your payments and credits grouped by day, like mobile banking."
          icon={ScrollText}
          imageSrc="/ui/hero-transactions.svg"
        />
        <Suspense>
          <TransactionFilters accounts={accounts} />
        </Suspense>
        <TransactionListGrouped
          items={rows}
          hidden={session.user.hideBalances}
          page={page}
          totalPages={totalPages}
          prevHref={prevHref}
          nextHref={nextHref}
        />
      </div>
    </div>
  );
}
