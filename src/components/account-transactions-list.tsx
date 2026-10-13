"use client";

import { useBalancePrivacy } from "@/components/balance-privacy-provider";
import { TransactionItem } from "@/components/bank";

type Txn = {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: string;
};

export function AccountTransactionsList({ items }: { items: Txn[] }) {
  const { hidden } = useBalancePrivacy();
  return (
    <>
      {items.map((txn) => (
        <TransactionItem
          key={txn.id}
          id={txn.id}
          title={txn.title}
          category={txn.category}
          date={txn.date}
          amount={txn.amount}
          type={txn.type}
          status={txn.status}
          hidden={hidden}
        />
      ))}
    </>
  );
}
