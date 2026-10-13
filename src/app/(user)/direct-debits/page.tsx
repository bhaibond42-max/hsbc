import { prisma } from "@/lib/db";
import { requireUserPage } from "@/server/auth";
import { DirectDebitsScreen } from "@/components/direct-debits-screen";

export default async function DirectDebitsPage() {
  const session = await requireUserPage();
  const [items, accounts] = await Promise.all([
    prisma.directDebit.findMany({
      where: { userId: session.user.id, active: true },
      include: { account: true },
      orderBy: { nextDate: "asc" },
    }),
    prisma.account.findMany({ where: { userId: session.user.id }, select: { id: true, name: true } }),
  ]);
  return (
    <DirectDebitsScreen
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount.toString(),
        nextDate: item.nextDate.toISOString(),
        reference: item.reference,
        accountName: item.account.name,
      }))}
      accounts={accounts}
    />
  );
}
