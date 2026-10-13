import { prisma } from "@/lib/db";
import { badRequest, json, readJson, route } from "@/lib/http";
import { payeeSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";
import { serializePayee } from "@/server/serialize";

export const GET = route(async () => {
  const current = await requireUserApi();
  const payees = await prisma.payee.findMany({ where: { userId: current.user.id }, orderBy: { name: "asc" } });
  return json({ payees: payees.map(serializePayee) });
});

export const POST = route(async (req) => {
  await requireUserApi();
  assertUserCanMutate();
  await readJson(req, payeeSchema);
  throw badRequest("Paying someone is not available on a savings account");
});
