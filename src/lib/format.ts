export function maskAccountNumber(accountNumber: string | null | undefined, style: "short" | "long" = "short"): string {
  const digits = (accountNumber ?? "").replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");
  return style === "long" ? `**** **** ${last4}` : `**** ${last4}`;
}

export function formatSortCode(sortCode: string): string {
  const digits = sortCode.replace(/\D/g, "");
  return digits.length === 6 ? `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}` : sortCode;
}

export function maskSortCode(sortCode: string): string {
  const digits = sortCode.replace(/\D/g, "");
  return `**-**-${digits.slice(-2)}`;
}

const dateShort = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
const dateMedium = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateLong = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

type DateInput = string | Date;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

export const formatDateShort = (d: DateInput) => dateShort.format(toDate(d));
export const formatDate = (d: DateInput) => dateMedium.format(toDate(d));
export const formatDateLong = (d: DateInput) => dateLong.format(toDate(d));
export const formatTime = (d: DateInput) => time.format(toDate(d));
export const formatDateTime = (d: DateInput) => dateTime.format(toDate(d));
export const formatMonthYear = (d: DateInput) => monthYear.format(toDate(d));

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatTodayLong(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function relativeTime(d: DateInput, now: Date = new Date()): string {
  const diffMs = now.getTime() - toDate(d).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function dayKey(d: DateInput): string {
  const date = toDate(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayHeading(d: DateInput, now: Date = new Date()): string {
  const key = dayKey(d);
  if (key === dayKey(now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === dayKey(yesterday)) return "Yesterday";
  return formatDateLong(d);
}

export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
