import { assertUserCanMutate } from "@/lib/user-access";
import { badRequest, readJson, route } from "@/lib/http";
import { paymentSchema } from "@/lib/validation";
import { requireUserApi } from "@/server/auth";

export const POST = route(async (req) => {
  await requireUserApi();
  assertUserCanMutate();
  await readJson(req, paymentSchema);
  throw badRequest("Paying someone is not available on a savings account");
});
