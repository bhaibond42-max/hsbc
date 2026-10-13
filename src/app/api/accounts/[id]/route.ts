import { prisma } from "@/lib/db";
import { json, notFound, route } from "@/lib/http";
import { requireUserApi } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeAccount, serializeTxn } from "@/server/serialize";

export const GET = route<{ id: string }>(async (_req, params) => {
  const current = await requireUserApi();
  const account = await prisma.account.findFirst({ where: { id: params.id, userId: current.user.id } });
  if (!account) throw notFound("Account not found");
  const txns = await queryTransactions({ accountId: account.id, page: 1, pageSize: 8 }, current.user.id);
  return json({
    account: serializeAccount(account, true),
    transactions: txns.items.map(serializeTxn),
  });
});
