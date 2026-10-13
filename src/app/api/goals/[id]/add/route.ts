import { prisma } from "@/lib/db";
import { badRequest, json, notFound, readJson, route } from "@/lib/http";
import { formatGBP, fromPence, toPence } from "@/lib/money";
import { goalAddSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";
import { notify, postEntry } from "@/server/ledger";

export const POST = route<{ id: string }>(async (req, params) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const input = await readJson(req, goalAddSchema);
  const goal = await prisma.$transaction(async (tx) => {
    const existing = await tx.savingsGoal.findFirst({ where: { id: params.id, userId: current.user.id } });
    if (!existing) throw notFound("Goal not found");
    const account = await tx.account.findFirst({ where: { id: input.fromAccountId, userId: current.user.id } });
    if (!account) throw notFound("Account not found");
    const nextSaved = toPence(existing.savedAmount.toString()) + toPence(input.amount);
    const target = toPence(existing.targetAmount.toString());
    if (nextSaved > target) throw badRequest("That amount is more than the remaining goal");
    await postEntry(tx, {
      accountId: account.id,
      type: "DEBIT",
      amount: input.amount,
      description: `Savings goal · ${existing.name}`,
      category: "Transfer",
      merchant: existing.name,
      enforceActive: true,
      createdById: current.user.id,
    });
    const updated = await tx.savingsGoal.update({
      where: { id: existing.id },
      data: { savedAmount: fromPence(nextSaved) },
    });
    await notify(tx, current.user.id, {
      type: "TRANSACTION",
      title: "Added to your goal",
      body: `${formatGBP(input.amount)} moved to ${existing.name}.`,
      link: "/goals",
    });
    return updated;
  });
  return json({
    goal: {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      savedAmount: goal.savedAmount.toString(),
    },
  });
});
