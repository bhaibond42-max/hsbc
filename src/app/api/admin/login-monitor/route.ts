import { json, readJson, route } from "@/lib/http";
import { adminDeleteLoginMonitorSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { deleteAllLoginMonitorEvents, listLoginMonitorEvents } from "@/server/login-monitor";

export const GET = route(async () => {
  await requireAdminApi();
  const events = await listLoginMonitorEvents(80);
  return json({ events, fetchedAt: new Date().toISOString() });
});

export const DELETE = route(async (req) => {
  await requireAdminApi();
  await readJson(req, adminDeleteLoginMonitorSchema);
  const deleted = await deleteAllLoginMonitorEvents();
  return json({ ok: true, deleted });
});
