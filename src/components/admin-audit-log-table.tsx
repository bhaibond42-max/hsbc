"use client";

import { useRouter } from "next/navigation";
import { formatDateTime, humanise } from "@/lib/format";
import { ApiError, api } from "@/lib/client";
import { Button } from "./ui";
import { useToast } from "./providers";

export type AuditLogRow = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
};

export function AdminAuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const router = useRouter();
  const toast = useToast();

  async function remove(id: string) {
    if (!window.confirm("Delete this audit log entry? This cannot be undone.")) return;
    try {
      await api(`/api/admin/audit/${id}`, { method: "DELETE", body: "{}" });
      toast("Audit entry deleted");
      router.refresh();
    } catch (cause) {
      toast(cause instanceof ApiError ? cause.message : "Could not delete");
    }
  }

  if (logs.length === 0) {
    return <p className="px-4 py-8 text-neutral-500">No audit entries yet.</p>;
  }

  return (
    <table className="w-full min-w-[920px] text-left text-sm">
      <thead className="border-b border-line text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3 font-medium">When</th>
          <th className="px-4 py-3 font-medium">Staff</th>
          <th className="px-4 py-3 font-medium">Action</th>
          <th className="px-4 py-3 font-medium">Target</th>
          <th className="px-4 py-3 font-medium">Reason</th>
          <th className="px-4 py-3 font-medium"> </th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id} className="border-b border-line align-top last:border-b-0">
            <td className="px-4 py-3 text-neutral-600">{formatDateTime(log.createdAt)}</td>
            <td className="px-4 py-3">{log.actorEmail}</td>
            <td className="px-4 py-3">{humanise(log.action)}</td>
            <td className="px-4 py-3 text-neutral-600">
              {log.targetType}
              {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
            </td>
            <td className="px-4 py-3 text-neutral-600">{log.reason ?? "—"}</td>
            <td className="px-4 py-3 text-right">
              <Button type="button" variant="danger" onClick={() => void remove(log.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
