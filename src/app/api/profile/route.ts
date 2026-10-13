import { json, route } from "@/lib/http";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";

export const PATCH = route(async () => {
  await requireUserApi();
  assertUserCanMutate();
  return json({ ok: true });
});
