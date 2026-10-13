import { auditQuerySchema } from "@/lib/validation";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { humanise } from "@/lib/format";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/server/auth";
import { AdminAuditLogTable } from "@/components/admin-audit-log-table";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsed = auditQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : { page: 1, pageSize: 25 };
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(query.action ? { action: query.action } : {}),
      ...(query.q ? { OR: [{ actorEmail: { contains: query.q, mode: "insensitive" } }, { reason: { contains: query.q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query.pageSize ?? 25,
    skip: ((query.page ?? 1) - 1) * (query.pageSize ?? 25),
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 text-sm text-neutral-500">Staff actions are recorded here. Staff can delete entries when required.</p>
      <form className="my-4 flex gap-2" action="/admin/audit-logs">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Search email or reason" className="h-11 flex-1 rounded-lg border border-line bg-white px-3 text-sm" />
        <select name="action" defaultValue={query.action ?? ""} className="h-11 rounded-lg border border-line bg-white px-2 text-sm">
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>{humanise(action)}</option>
          ))}
        </select>
        <button className="h-11 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <AdminAuditLogTable
          logs={logs.map((log) => ({
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            actorEmail: log.actorEmail,
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId,
            reason: log.reason,
          }))}
        />
      </div>
    </div>
  );
}
