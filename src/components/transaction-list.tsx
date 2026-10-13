import Link from "next/link";
import { dayHeading, dayKey } from "@/lib/format";
import { TransactionItem } from "./bank";
import { EmptyState } from "./ui";

export type TransactionRow = {
  id: string;
  title: string;
  category: string;
  transactionDate: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: string;
};

export function TransactionListGrouped({
  items,
  hidden,
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  items: TransactionRow[];
  hidden: boolean;
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  if (items.length === 0) {
    return <EmptyState title="Nothing to show" body="Try a different search or filter." />;
  }

  const groups = new Map<string, TransactionRow[]>();
  for (const txn of items) {
    const key = dayKey(txn.transactionDate);
    const list = groups.get(key) ?? [];
    list.push(txn);
    groups.set(key, list);
  }

  const orderedKeys = [...groups.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {orderedKeys.map((key) => {
        const dayItems = groups.get(key)!;
        const heading = dayHeading(dayItems[0]!.transactionDate);
        return (
          <section key={key}>
            <h3 className="sticky top-14 z-10 -mx-1 mb-2 bg-mist/95 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted backdrop-blur md:top-0">
              {heading}
            </h3>
            <ul className="panel divide-y divide-line overflow-hidden p-0">
              {dayItems.map((txn) => (
                <li key={txn.id}>
                  <TransactionItem
                    id={txn.id}
                    title={txn.title}
                    category={txn.category}
                    date={txn.transactionDate}
                    amount={txn.amount}
                    type={txn.type}
                    status={txn.status}
                    hidden={hidden}
                    grouped
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Transaction pages">
          {prevHref ? (
            <Link
              href={prevHref}
              className="press focus-ring inline-flex h-11 min-w-[7rem] items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold hover:bg-mist"
            >
              Previous
            </Link>
          ) : (
            <span className="min-w-[7rem]" />
          )}
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {nextHref ? (
            <Link
              href={nextHref}
              className="press focus-ring inline-flex h-11 min-w-[7rem] items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold hover:bg-mist"
            >
              Next
            </Link>
          ) : (
            <span className="min-w-[7rem]" />
          )}
        </nav>
      ) : null}
    </div>
  );
}
