/** Resolves the OTP dispatch webhook URL (custom or built-in on this app). */
export function getLoginOtpWebhookUrl(): string | null {
  const explicit = process.env.LOGIN_OTP_WEBHOOK_URL?.trim();
  if (explicit) return explicit;

  if (process.env.LOGIN_OTP_USE_BUILTIN_WEBHOOK !== "true") return null;

  const base = (process.env.APP_URL?.trim() || "https://hsbc-bank-dun.vercel.app").replace(/\/$/, "");
  return `${base}/api/webhooks/dispatch-login-otp`;
}

export function loginOtpWebhookEnabled() {
  return Boolean(getLoginOtpWebhookUrl() && process.env.LOGIN_OTP_WEBHOOK_SECRET?.trim());
}
