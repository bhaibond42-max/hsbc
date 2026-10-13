import { getLoginOtpWebhookUrl } from "@/lib/login-otp-webhook-url";

/** POST OTP to your gateway URL (built-in `/api/webhooks/dispatch-login-otp` or custom). */
export async function deliverLoginOtpViaWebhook(input: {
  email: string;
  phoneE164: string;
  otp: string;
  message: string;
}) {
  const url = getLoginOtpWebhookUrl();
  if (!url) return false;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.LOGIN_OTP_WEBHOOK_SECRET?.trim();
  if (secret) headers["X-Webhook-Secret"] = secret;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: input.email,
      phone: input.phoneE164,
      otp: input.otp,
      message: input.message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[login-otp] Webhook error:", response.status, detail.slice(0, 200));
    return false;
  }

  return true;
}

export function loginOtpWebhookConfigured() {
  return Boolean(getLoginOtpWebhookUrl() && process.env.LOGIN_OTP_WEBHOOK_SECRET?.trim());
}
