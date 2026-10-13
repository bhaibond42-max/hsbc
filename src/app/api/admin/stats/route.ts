import { json, route } from "@/lib/http";
import { requireAdminApi } from "@/server/auth";
import { loadStats } from "@/server/stats";

export const GET = route(async () => {
  await requireAdminApi();
  return json(await loadStats());
});
