import { json, route, unauthorized } from "@/lib/http";
import { getSession } from "@/server/auth";
import { serializeUser } from "@/server/serialize";

export const GET = route(async () => {
  const current = await getSession();
  if (!current) throw unauthorized();
  return json({ user: serializeUser(current.user) });
});
