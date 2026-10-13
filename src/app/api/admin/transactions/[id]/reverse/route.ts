import { prisma } from "@/lib/db";
import { json, readJson, requestMeta, route } from "@/lib/http";
import { formatGBP } from "@/lib/money";
import { reverseTransactionSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { notify, reverseTransaction, writeAudit } from "@/server/ledger";
import { serializeTxn } from "@/server/serialize";

export const POST = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, reverseTransactionSchema);
  const meta = requestMeta(req);
  const result = await prisma.$transaction(async (tx) => {
    const reversed = await reverseTransaction(tx, params.id, admin.user.id, input.reason);
    await notify(tx, reversed.original.account.userId, {
      type: "TRANSACTION",
      title: "Transaction reversed",
      body: `${reversed.original.description} (${formatGBP(reversed.original.amount.toString())}) was reversed. ${input.reason}`,
      link: `/transactions/${reversed.reversal.id}`,
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "TRANSACTION_REVERSED",
      targetType: "transaction",
      targetId: reversed.original.id,
      targetUserId: reversed.original.account.userId,
      oldValue: { reference: reversed.original.reference, status: "COMPLETED" },
      newValue: { status: "REVERSED", reversal: reversed.reversal.reference },
      reason: input.reason,
      summary: `Reversed ${reversed.original.reference}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return reversed.reversal;
  });
  return json({ transaction: serializeTxn(result) });
});
