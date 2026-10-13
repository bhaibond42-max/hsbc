import { prisma } from "@/lib/db";
import { requireUserPage } from "@/server/auth";
import { serializeAccount, serializeTxn } from "@/server/serialize";
import { CardsManager } from "@/components/cards-manager";

export default async function CardsPage() {
  const session = await requireUserPage();
  const accounts = await prisma.account.findMany({ where: { userId: session.user.id, cardLast4: { not: null } } });
  const cardAccountIds = accounts.map((a) => a.id);
  const transactions =
    cardAccountIds.length === 0
      ? []
      : await prisma.transaction.findMany({
          where: { accountId: { in: cardAccountIds }, type: "DEBIT", status: "COMPLETED" },
          orderBy: { transactionDate: "desc" },
          take: 8,
        });

  return (
    <CardsManager
      hidden={session.user.hideBalances}
      recent={transactions.map((txn) => {
        const view = serializeTxn(txn);
        return {
          id: view.id,
          title: view.merchant || view.description,
          amount: view.amount,
          date: view.transactionDate,
          category: view.category,
        };
      })}
      cards={accounts.map((account) => {
        const view = serializeAccount(account);
        return {
          id: account.id,
          name: account.name,
          cardFrozen: account.cardFrozen,
          contactlessEnabled: view.contactlessEnabled,
          onlineEnabled: view.onlineEnabled,
          atmEnabled: view.atmEnabled,
          dailyLimit: view.dailyLimit,
        };
      })}
    />
  );
}
