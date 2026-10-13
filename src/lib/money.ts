/**
 * Money is handled as integer pence (bigint) for all arithmetic and as
 * fixed two-decimal strings at API boundaries. Floating point is never used
 * to compute balances.
 */

export const MAX_AMOUNT_PENCE = 100_000_000n; // £1,000,000.00 — customer-facing transfers and payments

/** Upper bound for account balances and staff-posted amounts (matches Decimal(14, 2) in the database). */
export const MAX_DB_AMOUNT_PENCE = 99_999_999_999_999n; // £999,999,999,999.99

const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

export function toPence(value: string | number | { toString(): string }): bigint {
  const raw = typeof value === "string" ? value.trim() : value.toString();
  const match = DECIMAL_RE.exec(raw);
  if (!match) throw new Error(`Invalid monetary value: ${raw}`);
  const [, sign, pounds, fraction = ""] = match;
  const pence = BigInt(pounds) * 100n + BigInt(fraction.padEnd(2, "0"));
  return sign ? -pence : pence;
}

export function fromPence(pence: bigint): string {
  const negative = pence < 0n;
  const abs = negative ? -pence : pence;
  const pounds = abs / 100n;
  const rest = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${pounds.toString()}.${rest}`;
}

export function normaliseAmount(value: string | number | { toString(): string }): string {
  return fromPence(toPence(value));
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a decimal string for display. Display-only: never feed the result back into arithmetic. */
export function formatGBP(value: string | number, options: { sign?: "auto" | "always" } = {}): string {
  const pence = toPence(typeof value === "number" ? value.toFixed(2) : value);
  const abs = pence < 0n ? -pence : pence;
  const formatted = gbp.format(Number(fromPence(abs)));
  if (pence < 0n) return `-${formatted}`;
  if (options.sign === "always" && pence > 0n) return `+${formatted}`;
  return formatted;
}

export function signedAmount(type: "CREDIT" | "DEBIT", amount: string): string {
  return type === "DEBIT" ? fromPence(-toPence(amount)) : normaliseAmount(amount);
}
