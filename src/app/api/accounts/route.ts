import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { requireUserApi } from "@/server/auth";
import { serializeAccount } from "@/server/serialize";

export const GET = route(async () => {
  const current = await requireUserApi();
  const accounts = await prisma.account.findMany({
    where: { userId: current.user.id },
    orderBy: { createdAt: "asc" },
  });
  return json({ accounts: accounts.map((account) => serializeAccount(account, true)) });
});
