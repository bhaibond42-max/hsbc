export const BRAND = "HSBC UK";
export const SESSION_COOKIE = "demo_session";
export const LOGIN_PIN_CHALLENGE_COOKIE = "login_pin_challenge";

export const CATEGORIES = [
  "Groceries",
  "Salary",
  "Eating out",
  "Bills",
  "Rent",
  "Subscriptions",
  "Shopping",
  "Transport",
  "Entertainment",
  "Transfer",
  "Refund",
  "Cash",
  "Adjustment",
  "Reversal",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const TRANSACTION_STATUSES = ["COMPLETED", "PENDING", "FAILED", "REVERSED"] as const;
export const TRANSACTION_TYPES = ["CREDIT", "DEBIT"] as const;
export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "LOCKED"] as const;
export const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;
export const NOTIFICATION_TYPES = ["INFO", "TRANSACTION", "SECURITY", "STATEMENT"] as const;

export const AUDIT_ACTIONS = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_SUSPENDED",
  "USER_ACTIVATED",
  "USER_LOCKED",
  "USER_UNLOCKED",
  "BALANCE_CREDITED",
  "BALANCE_DEBITED",
  "TRANSACTION_CREATED",
  "TRANSACTION_UPDATED",
  "TRANSACTION_REVERSED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_ACTIVATED",
  "PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "NOTIFICATION_SENT",
  "ADMIN_2FA_ENABLED",
  "ADMIN_2FA_DISABLED",
  "PAYMENT_CREATED",
  "TRANSFER_CREATED",
  "CARD_FROZEN",
  "CARD_UNFROZEN",
] as const;

export const DEMO_SORT_CODE = "40-77-21";
