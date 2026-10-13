"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { relativeTime } from "@/lib/format";
import { api } from "@/lib/client";
import { EmptyState, PageHeader } from "@/components/ui";

type Item = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: Item[] }>("/api/notifications"),
  });
  const items = query.data?.notifications ?? [];

  function open(item: Item) {
    if (item.link) router.push(item.link);
  }

  return (
    <div>
      <PageHeader title="Notifications" back="/home" />
      <div className="space-y-4 px-5">
        {query.isLoading ? <p className="text-sm text-neutral-500">Loading…</p> : null}
        {query.isError ? <p className="text-sm text-red-700">Notifications could not be loaded.</p> : null}
        {!query.isLoading && items.length === 0 ? (
          <EmptyState title="You're up to date" body="Balance updates and statements will appear here." />
        ) : null}
        <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => open(item)} className="flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-b-0">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-brand"}`} />
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-sm text-neutral-600">{item.body}</span>
                  <span className="mt-1 block text-xs text-neutral-400">{relativeTime(item.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link href="/profile#settings" className="block text-sm font-medium text-brand">
          View alert preferences
        </Link>
      </div>
    </div>
  );
}
