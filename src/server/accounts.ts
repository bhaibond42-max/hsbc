import { randomInt } from "crypto";
import type { Tx } from "./ledger";

export async function allocateAccountNumber(tx: Tx) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const accountNumber = String(randomInt(10_000_000, 100_000_000));
    const existing = await tx.account.findUnique({ where: { accountNumber } });
    if (!existing) return accountNumber;
  }
  throw new Error("Could not allocate an account number");
}

export function allocateCardLast4() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}
