import type { Account, Notification, Payee, ScheduledPayment, Transaction, User } from "@prisma/client";
import { maskAccountNumber, maskSortCode } from "@/lib/format";

type TxnRow = Transaction & {
  account?: Account & { user?: Pick<User, "id" | "fullName" | "email"> | null };
  reversedBy?: { id: string } | null;
};

export function money(value: { toString(): string }) {
  return value.toString();
}

export function serializeAccount(account: Account, reveal = false) {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    accountType: account.accountType,
    currency: account.currency,
    accountNumber: reveal ? account.accountNumber : maskAccountNumber(account.accountNumber, "long"),
    accountNumberMasked: maskAccountNumber(account.accountNumber, "short"),
    sortCode: reveal ? account.sortCode : maskSortCode(account.sortCode),
    sortCodeFull: reveal ? account.sortCode : undefined,
    availableBalance: money(account.availableBalance),
    currentBalance: money(account.currentBalance),
    status: account.status,
    cardLast4: account.cardLast4,
    cardFrozen: account.cardFrozen,
    contactlessEnabled: account.contactlessEnabled,
    onlineEnabled: account.onlineEnabled,
    atmEnabled: account.atmEnabled,
    dailyLimit: money(account.dailyLimit),
    createdAt: account.createdAt.toISOString(),
  };
}

export function serializeTxn(txn: TxnRow) {
  return {
    id: txn.id,
    accountId: txn.accountId,
    accountName: txn.account?.name ?? "",
    accountMasked: txn.account ? maskAccountNumber(txn.account.accountNumber, "short") : "",
    ownerId: txn.account?.userId,
    ownerName: txn.account?.user?.fullName ?? "",
    reference: txn.reference,
    type: txn.type,
    category: txn.category,
    description: txn.description,
    merchant: txn.merchant,
    notes: txn.notes,
    amount: money(txn.amount),
    currency: txn.currency,
    balanceAfter: money(txn.balanceAfter),
    status: txn.status,
    transactionDate: txn.transactionDate.toISOString(),
    reversalOfId: txn.reversalOfId,
    reversed: txn.status === "REVERSED" || Boolean(txn.reversedBy),
    createdAt: txn.createdAt.toISOString(),
  };
}

export function serializeUser(user: User, extras?: { balance?: string; accounts?: number }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    hideBalances: user.hideBalances,
    notifyTransactions: user.notifyTransactions,
    notifyStatements: user.notifyStatements,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    balance: extras?.balance,
    accounts: extras?.accounts,
  };
}

export function serializeNotification(item: Notification) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    link: item.link,
    read: item.read,
    createdAt: item.createdAt.toISOString(),
  };
}

export function serializePayee(payee: Payee) {
  return {
    id: payee.id,
    name: payee.name,
    accountNumber: maskAccountNumber(payee.accountNumber, "long"),
    sortCode: payee.sortCode,
    reference: payee.reference,
    createdAt: payee.createdAt.toISOString(),
  };
}

export function serializeSchedule(item: ScheduledPayment & { payee?: Payee | null }) {
  return {
    id: item.id,
    payeeId: item.payeeId,
    payeeName: item.payee?.name ?? "Payee",
    accountId: item.accountId,
    amount: money(item.amount),
    frequency: item.frequency,
    nextDate: item.nextDate.toISOString(),
    reference: item.reference,
    active: item.active,
  };
}
