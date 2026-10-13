import { prisma } from "@/lib/db";
import { json, notFound, readJson, route } from "@/lib/http";
import { cardControlsSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";
import { notify } from "@/server/ledger";
import { serializeAccount } from "@/server/serialize";

export const PATCH = route<{ id: string }>(async (req, params) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const input = await readJson(req, cardControlsSchema);
  const account = await prisma.account.findFirst({ where: { id: params.id, userId: current.user.id } });
  if (!account || !account.cardLast4) throw notFound("Card not found");
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.account.update({
      where: { id: account.id },
      data: {
        contactlessEnabled: input.contactlessEnabled,
        onlineEnabled: input.onlineEnabled,
        atmEnabled: input.atmEnabled,
        dailyLimit: input.dailyLimit,
      },
    });
    await notify(tx, current.user.id, {
      type: "SECURITY",
      title: "Card controls updated",
      body: `Daily limit is now £${input.dailyLimit} on the card ending ${account.cardLast4}.`,
      link: "/cards",
    });
    return next;
  });
  return json({ account: serializeAccount(updated, true) });
});
