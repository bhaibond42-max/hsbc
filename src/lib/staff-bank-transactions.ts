import type { Category } from "@/lib/constants";

/** Customer-facing copy when staff credits or debits an account (bank-side posting). */
export function staffAdjustTransactionPresentation(type: "CREDIT" | "DEBIT"): {
  merchant: string;
  description: string;
  category: Category;
  notificationTitle: string;
  notificationBody: (amountLabel: string) => string;
} {
  if (type === "CREDIT") {
    return {
      merchant: "HSBC UK",
      description: "Bank Giro Credit",
      category: "Salary",
      notificationTitle: "Money received",
      notificationBody: (amountLabel) => `Bank Giro Credit of ${amountLabel} from HSBC UK.`,
    };
  }
  return {
    merchant: "HSBC UK",
    description: "Account debit",
    category: "Bills",
    notificationTitle: "Payment made",
    notificationBody: (amountLabel) => `Account debit of ${amountLabel} by HSBC UK.`,
  };
}

export function isStaffBankSideTransaction(input: {
  merchant: string | null;
  description: string;
}): boolean {
  if (input.merchant !== "HSBC UK") return false;
  return input.description === "Bank Giro Credit" || input.description === "Account debit";
}
