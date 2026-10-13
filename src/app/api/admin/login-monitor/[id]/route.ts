import { json, notFound, readJson, route } from "@/lib/http";
import { adminDeleteLoginMonitorSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { deleteLoginMonitorEvent } from "@/server/login-monitor";

export const DELETE = route<{ id: string }>(async (req, params) => {
  await requireAdminApi();
  await readJson(req, adminDeleteLoginMonitorSchema);

  const removed = await deleteLoginMonitorEvent(params.id);
  if (!removed) throw notFound("Log on event not found");

  return json({ ok: true });
});
