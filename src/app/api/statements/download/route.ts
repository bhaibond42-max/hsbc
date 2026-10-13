import { NextResponse } from "next/server";
import { readQuery, route } from "@/lib/http";
import { formatDateTime } from "@/lib/format";
import { statementQuerySchema } from "@/lib/validation";
import { requireUserApi } from "@/server/auth";
import { loadStatement } from "@/server/statements";

export const GET = route(async (req) => {
  const current = await requireUserApi();
  const query = readQuery(req, statementQuerySchema);
  const statement = await loadStatement(current.user.id, query.accountId, query.from, query.to);
  const lines = [
    "Date,Description,Type,Status,Amount,Balance after,Reference",
    ...statement.items.map((item) =>
      [
        formatDateTime(item.transactionDate),
        `"${item.description.replaceAll('"', "'")}"`,
        item.type,
        item.status,
        `${item.type === "DEBIT" ? "-" : ""}${item.amount.toString()}`,
        item.balanceAfter.toString(),
        item.reference,
      ].join(","),
    ),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="statement-${statement.account.accountNumber.slice(-4)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
