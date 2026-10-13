import { prisma } from "@/lib/db";
import { requireUserPage } from "@/server/auth";
import { GoalsScreen } from "@/components/goals-screen";

export default async function GoalsPage() {
  const session = await requireUserPage();
  const [goals, accounts] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
    prisma.account.findMany({ where: { userId: session.user.id }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return (
    <GoalsScreen
      goals={goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        savedAmount: goal.savedAmount.toString(),
      }))}
      accounts={accounts}
    />
  );
}
