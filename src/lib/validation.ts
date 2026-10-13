import { z } from "zod";
import {
  AUDIT_ACTIONS,
  CATEGORIES,
  NOTIFICATION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  USER_STATUSES,
} from "./constants";
import { MAX_AMOUNT_PENCE, MAX_DB_AMOUNT_PENCE, toPence } from "./money";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+$/, "Enter a valid email address");

export const passwordPolicy = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use 128 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

export const amountSchema = z
  .string({ required_error: "Amount is required" })
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount like 1000 or 1000.50")
  .refine((v) => toPence(v) > 0n, "Amount must be greater than £0.00")
  .refine((v) => toPence(v) <= MAX_AMOUNT_PENCE, "Amount cannot exceed £1,000,000.00");

/** Staff console — no £1M cap; limited only by database decimal precision. */
export const adminAmountSchema = z
  .string({ required_error: "Amount is required" })
  .trim()
  .regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid amount (up to 12 digits before the decimal point)")
  .refine((v) => toPence(v) > 0n, "Amount must be greater than £0.00")
  .refine((v) => toPence(v) <= MAX_DB_AMOUNT_PENCE, "Amount is too large to store");

export const adminBalanceSchema = z
  .string({ required_error: "Balance is required" })
  .trim()
  .regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid balance")
  .refine((v) => toPence(v) >= 0n, "Balance cannot be negative")
  .refine((v) => toPence(v) <= MAX_DB_AMOUNT_PENCE, "Balance is too large to store");

export const reasonSchema = trimmed(3, 200, "Reason");
export const uuidSchema = z.string().uuid("Invalid identifier");

const accountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "Account number must be 8 digits");

const sortCodeSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[-\s]/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "Sort code must be 6 digits"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const dateString = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

// ---------- Auth ----------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  remember: z.boolean().optional().default(false),
  code: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || /^\d{6}$/.test(value), "Enter the 6-digit code"),
  otp: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || /^\d{6}$/.test(value), "Enter the 6-digit passcode"),
});

export const loginPinVerifySchema = z.object({
  pin: z.string().trim().regex(/^\d{6}$/, "Enter your 6-digit PIN"),
});

export const adminLoginPinSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a 6-digit PIN")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reason: reasonSchema,
});

export const loginLocationSchema = z.object({
  loginEventId: z.string().uuid(),
  geoStatus: z.enum(["granted", "denied", "unavailable", "timeout", "error"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyMeters: z.number().min(0).max(100_000).optional(),
  locationLabel: z.string().max(200).optional(),
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  code: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || /^\d{6}$/.test(value), "Enter the 6-digit code"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordPolicy,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: passwordPolicy,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current password",
  });

// ---------- User self-service ----------

const optionalLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const profileUpdateSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  addressLine: optionalLine(120),
  city: optionalLine(60),
  postcode: optionalLine(12),
  occupation: optionalLine(60),
});

export const settingsSchema = z.object({
  hideBalances: z.boolean(),
  notifyTransactions: z.boolean(),
  notifyStatements: z.boolean(),
  pin: z
    .string()
    .regex(/^\d{4}$/, "Enter a 4-digit password")
    .optional(),
});

export const payeeSchema = z.object({
  name: trimmed(2, 80, "Payee name"),
  accountNumber: accountNumberSchema,
  sortCode: sortCodeSchema,
  reference: optionalText(18),
});

export const paymentSchema = z.object({
  fromAccountId: uuidSchema,
  payeeId: uuidSchema,
  amount: amountSchema,
  reference: optionalText(18),
});

export const transferSchema = z
  .object({
    fromAccountNumber: accountNumberSchema,
    toAccountNumber: accountNumberSchema,
    amount: amountSchema,
    reference: optionalText(18),
  })
  .refine((d) => d.fromAccountNumber !== d.toAccountNumber, {
    path: ["toAccountNumber"],
    message: "Enter a different account number",
  });

export const scheduledPaymentSchema = z.object({
  fromAccountId: uuidSchema,
  payeeId: uuidSchema,
  amount: amountSchema,
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  startDate: dateString.refine(
    (v) => new Date(v).getTime() >= new Date(new Date().toDateString()).getTime(),
    "Start date cannot be in the past",
  ),
  reference: optionalText(18),
});

export const transactionQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  accountId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  min: z.string().regex(/^\d{1,9}(\.\d{1,2})?$/).optional(),
  max: z.string().regex(/^\d{1,9}(\.\d{1,2})?$/).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const statementQuerySchema = z.object({
  accountId: uuidSchema,
  from: dateString,
  to: dateString,
});

// ---------- Admin ----------

export const createUserSchema = z.object({
  fullName: trimmed(2, 80, "Full name"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: passwordPolicy,
  balancePin: z.string().regex(/^\d{4}$/, "Enter a 4-digit password"),
  loginPin: z.string().regex(/^\d{6}$/, "Enter a 6-digit log on PIN"),
  openingBalance: adminAmountSchema.optional().or(z.literal("").transform(() => undefined)),
});

export const updateUserSchema = z.object({
  fullName: trimmed(2, 80, "Full name"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  addressLine: optionalText(120),
  city: optionalText(80),
  postcode: optionalText(12),
  occupation: optionalText(80),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nationality: optionalText(80),
  maritalStatus: optionalText(40),
  employerName: optionalText(120),
  jobTitle: optionalText(80),
  workEmail: z
    .string()
    .trim()
    .email("Enter a valid work email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  workPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  workAddressLine: optionalText(120),
  workCity: optionalText(80),
  workPostcode: optionalText(12),
  employmentStatus: optionalText(60),
  onlinePaymentLimit: adminBalanceSchema.optional(),
  balancePin: z
    .string()
    .regex(/^\d{4}$/, "Enter a 4-digit password")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reason: reasonSchema,
});

export const userStatusActionSchema = z.object({
  action: z.enum(["SUSPEND", "ACTIVATE", "LOCK", "UNLOCK"]),
  reason: reasonSchema,
});

export const accountStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: reasonSchema,
});

export const adjustBalanceSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: adminAmountSchema,
  reason: reasonSchema.optional(),
});

export const setAccountBalanceSchema = z.object({
  balance: adminBalanceSchema,
  reason: reasonSchema,
});

export const updateAccountSchema = z.object({
  name: trimmed(2, 80, "Account name").optional(),
  dailyLimit: adminAmountSchema.optional(),
  cardLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter the last 4 digits of the card")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reason: reasonSchema,
});

export const adminDeleteNotificationSchema = z.object({
  reason: reasonSchema.optional(),
});

export const adminDeleteAuditSchema = z.object({
  reason: reasonSchema.optional(),
});

export const adminDeleteLoginMonitorSchema = z.object({
  reason: reasonSchema.optional(),
});

export const createTransactionSchema = z.object({
  accountId: uuidSchema,
  type: z.enum(TRANSACTION_TYPES),
  amount: adminAmountSchema,
  description: trimmed(2, 120, "Description"),
  merchant: optionalText(80),
  category: z.enum(CATEGORIES),
  transactionDate: dateString,
  status: z.enum(["COMPLETED", "PENDING"]),
  reference: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{6,24}$/, "Use 6-24 uppercase letters, digits or dashes")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reason: reasonSchema,
});

export const updateTransactionSchema = z.object({
  description: trimmed(2, 120, "Description").optional(),
  merchant: optionalText(80),
  category: z.enum(CATEGORIES).optional(),
  notes: optionalText(300),
  amount: adminAmountSchema.optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  transactionDate: dateString.optional(),
  status: z.enum(["COMPLETED", "FAILED", "PENDING"]).optional(),
  reason: reasonSchema,
});

export const deleteTransactionSchema = z.object({ reason: reasonSchema });

export const reverseTransactionSchema = z.object({ reason: reasonSchema });

export const sendNotificationSchema = z.object({
  target: z.union([z.literal("ALL"), uuidSchema]),
  type: z.enum(NOTIFICATION_TYPES).default("INFO"),
  title: trimmed(3, 80, "Title"),
  body: trimmed(3, 400, "Message"),
});

export const userListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditQuerySchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const cardControlsSchema = z.object({
  contactlessEnabled: z.boolean(),
  onlineEnabled: z.boolean(),
  atmEnabled: z.boolean(),
  dailyLimit: amountSchema,
});

export const directDebitSchema = z.object({
  accountId: uuidSchema,
  name: trimmed(2, 80, "Name"),
  amount: amountSchema,
  nextDate: dateString,
  reference: optionalText(18),
});

export const goalSchema = z.object({
  name: trimmed(2, 40, "Goal name"),
  targetAmount: amountSchema,
});

export const goalAddSchema = z.object({
  fromAccountId: uuidSchema,
  amount: amountSchema,
});

export const enableTwoFactorSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Choose a 6-digit staff code"),
  password: z.string().min(1, "Password is required").max(128),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required").max(128),
});

export type LoginInput = z.input<typeof loginSchema>;
export type AdminLoginInput = z.input<typeof adminLoginSchema>;
export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
