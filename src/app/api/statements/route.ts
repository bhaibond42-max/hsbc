import { json, readQuery, route } from "@/lib/http";
import { statementQuerySchema } from "@/lib/validation";
import { requireUserApi } from "@/server/auth";
import { serializeTxn } from "@/server/serialize";
import { loadStatement } from "@/server/statements";

export const GET = route(async (req) => {
  const current = await requireUserApi();
  const query = readQuery(req, statementQuerySchema);
  const statement = await loadStatement(current.user.id, query.accountId, query.from, query.to);
  return json({
    accountName: statement.account.name,
    openingBalance: statement.opening,
    closingBalance: statement.closing,
    credits: statement.credits,
    debits: statement.debits,
    from: statement.start.toISOString(),
    to: statement.end.toISOString(),
    transactions: statement.items.map(serializeTxn),
  });
});
