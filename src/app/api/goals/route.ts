import { prisma } from "@/lib/db";
import { json, readJson, route } from "@/lib/http";
import { goalSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";

function serialize(goal: { id: string; name: string; targetAmount: { toString(): string }; savedAmount: { toString(): string } }) {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount.toString(),
    savedAmount: goal.savedAmount.toString(),
  };
}

export const GET = route(async () => {
  const current = await requireUserApi();
  const goals = await prisma.savingsGoal.findMany({ where: { userId: current.user.id }, orderBy: { createdAt: "asc" } });
  return json({ goals: goals.map(serialize) });
});

export const POST = route(async (req) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const input = await readJson(req, goalSchema);
  const goal = await prisma.savingsGoal.create({
    data: { userId: current.user.id, name: input.name, targetAmount: input.targetAmount },
  });
  return json({ goal: serialize(goal) }, 201);
});
