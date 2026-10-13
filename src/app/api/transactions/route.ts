import { json, pageMeta, readQuery, route } from "@/lib/http";
import { transactionQuerySchema } from "@/lib/validation";
import { requireUserApi } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";

export const GET = route(async (req) => {
  const current = await requireUserApi();
  const query = readQuery(req, transactionQuerySchema);
  const result = await queryTransactions(query, current.user.id);
  return json({
    transactions: result.items.map(serializeTxn),
    ...pageMeta(result.page, result.pageSize, result.total),
  });
});
