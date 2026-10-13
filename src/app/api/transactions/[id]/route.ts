import { json, notFound, route } from "@/lib/http";
import { requireUserApi } from "@/server/auth";
import { getOwnedTransaction } from "@/server/queries";
import { serializeTxn } from "@/server/serialize";

export const GET = route<{ id: string }>(async (_req, params) => {
  const current = await requireUserApi();
  const txn = await getOwnedTransaction(current.user.id, params.id);
  if (!txn) throw notFound("Transaction not found");
  return json({ transaction: serializeTxn(txn) });
});
