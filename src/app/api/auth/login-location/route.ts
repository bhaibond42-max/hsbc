import { json, readJson, route } from "@/lib/http";
import { loginLocationSchema } from "@/lib/validation";
import { requireUserApi } from "@/server/auth";
import { applyLoginMonitorLocation } from "@/server/login-monitor";

export const POST = route(async (req) => {
  const session = await requireUserApi();
  const input = await readJson(req, loginLocationSchema);
  const updated = await applyLoginMonitorLocation(session.user.id, input.loginEventId, input);
  if (!updated) return json({ ok: false }, 404);
  return json({ ok: true });
});
