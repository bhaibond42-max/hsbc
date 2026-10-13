import { prisma } from "@/lib/db";
import { badRequest, json, readJson, route } from "@/lib/http";
import { formatGBP } from "@/lib/money";
import { transferSchema } from "@/lib/validation";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";
import { notify, postEntry } from "@/server/ledger";
import { serializeTxn } from "@/server/serialize";

export const POST = route(async (req) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const input = await readJson(req, transferSchema);
  const debit = await prisma.$transaction(async (tx) => {
    const source = await tx.account.findFirst({ where: { accountNumber: input.fromAccountNumber, userId: current.user.id } });
    const destination = await tx.account.findFirst({ where: { accountNumber: input.toAccountNumber, userId: current.user.id } });
    if (!source || !destination) throw badRequest("Enter account numbers from your savings accounts");
    const out = await postEntry(tx, {
      accountId: source.id,
      type: "DEBIT",
      amount: input.amount,
      description: `Transfer to ${destination.name}`,
      category: "Transfer",
      notes: input.reference,
      enforceActive: true,
      createdById: current.user.id,
    });
    await postEntry(tx, {
      accountId: destination.id,
      type: "CREDIT",
      amount: input.amount,
      description: `Transfer from ${source.name}`,
      category: "Transfer",
      notes: input.reference,
      reference: `${out.reference}-IN`,
      createdById: current.user.id,
    });
    if (current.user.notifyTransactions) {
      await notify(tx, current.user.id, {
        type: "TRANSACTION",
        title: "Transfer complete",
        body: `${formatGBP(input.amount)} moved to ${destination.name}.`,
        link: `/transactions/${out.id}`,
      });
    }
    return out;
  });
  return json({ transaction: serializeTxn(debit) }, 201);
});
