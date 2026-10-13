import { json, route } from "@/lib/http";
import { destroyCurrentSession } from "@/server/auth";
import { clearLoginPinChallengeCookie } from "@/server/login-pin";

export const POST = route(async () => {
  await destroyCurrentSession();
  await clearLoginPinChallengeCookie();
  return json({ ok: true });
});
