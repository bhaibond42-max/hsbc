import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { userListQuerySchema } from "@/lib/validation";
import { requireAdminPage } from "@/server/auth";
import { StatusBadge } from "@/components/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsed = userListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : { page: 1, pageSize: 20 };
  const where = {
    role: "USER" as const,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? { OR: [{ fullName: { contains: query.q, mode: "insensitive" as const } }, { email: { contains: query.q, mode: "insensitive" as const } }] }
      : {}),
  };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: ((query.page ?? 1) - 1) * (query.pageSize ?? 20),
    take: query.pageSize ?? 20,
    include: { accounts: { select: { currentBalance: true } } },
  });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link href="/admin/users/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
          New customer
        </Link>
      </div>
      <form className="mb-4 flex gap-2" action="/admin/users">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Search name or email" className="h-11 flex-1 rounded-lg border border-line bg-white px-3 text-sm" />
        <select name="status" defaultValue={query.status ?? ""} className="h-11 rounded-lg border border-line bg-white px-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="LOCKED">Locked</option>
        </select>
        <button className="h-11 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Last log on</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const pence = user.accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);
              return (
                <tr key={user.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3">{formatGBP(pence.toFixed(2))}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-semibold text-brand">Manage</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
