import { prisma } from "@/lib/db";
import { json, notFound, readJson, route } from "@/lib/http";
import { directDebitSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";

function serialize(item: {
  id: string;
  name: string;
  reference: string | null;
  amount: { toString(): string };
  nextDate: Date;
  active: boolean;
  account: { name: string };
}) {
  return {
    id: item.id,
    name: item.name,
    reference: item.reference,
    amount: item.amount.toString(),
    nextDate: item.nextDate.toISOString(),
    active: item.active,
    accountName: item.account.name,
  };
}

export const GET = route(async () => {
  const current = await requireUserApi();
  const items = await prisma.directDebit.findMany({
    where: { userId: current.user.id, active: true },
    include: { account: true },
    orderBy: { nextDate: "asc" },
  });
  return json({ directDebits: items.map(serialize) });
});

export const POST = route(async (req) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const input = await readJson(req, directDebitSchema);
  const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: current.user.id } });
  if (!account) throw notFound("Account not found");
  const created = await prisma.directDebit.create({
    data: {
      userId: current.user.id,
      accountId: account.id,
      name: input.name,
      amount: input.amount,
      nextDate: new Date(input.nextDate),
      reference: input.reference,
    },
    include: { account: true },
  });
  return json({ directDebit: serialize(created) }, 201);
});
