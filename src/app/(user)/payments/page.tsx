import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/server/auth";
import { serializeAccount } from "@/server/serialize";
import { PaymentsScreen } from "@/components/payments-screen";

export default async function PaymentsPage() {
  const session = await requireUserPage();
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, accountType: "SAVINGS" },
    orderBy: { createdAt: "asc" },
  });
  const payees = await prisma.payee.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  const recent = await prisma.transaction.findMany({
    where: { account: { userId: session.user.id }, status: "COMPLETED" },
    orderBy: { transactionDate: "desc" },
    take: 6,
    select: { id: true, description: true, amount: true, type: true, transactionDate: true },
  });
  return (
    <Suspense>
      <PaymentsScreen
        hidden={session.user.hideBalances}
        recent={recent.map((txn) => ({
          id: txn.id,
          description: txn.description,
          amount: txn.amount.toString(),
          type: txn.type,
          transactionDate: txn.transactionDate.toISOString(),
        }))}
        accounts={accounts.map((account) => {
          const view = serializeAccount(account);
          return { id: account.id, name: view.name, availableBalance: view.availableBalance };
        })}
        payees={payees.map((payee) => ({ id: payee.id, name: payee.name }))}
      />
    </Suspense>
  );
}
