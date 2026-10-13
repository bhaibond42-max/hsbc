import { prisma } from "@/lib/db";
import { json, notFound, route } from "@/lib/http";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";
import { notify } from "@/server/ledger";
import { serializeAccount } from "@/server/serialize";

export const POST = route<{ id: string }>(async (_req, params) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const account = await prisma.account.findFirst({ where: { id: params.id, userId: current.user.id } });
  if (!account || !account.cardLast4) throw notFound("Card not found");
  const cardFrozen = !account.cardFrozen;
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.account.update({ where: { id: account.id }, data: { cardFrozen } });
    await notify(tx, current.user.id, {
      type: "SECURITY",
      title: cardFrozen ? "Card frozen" : "Card unfrozen",
      body: `The card ending ${account.cardLast4} is now ${cardFrozen ? "frozen" : "active"}.`,
      link: `/accounts/${account.id}`,
    });
    return next;
  });
  return json({ account: serializeAccount(updated, true) });
});
