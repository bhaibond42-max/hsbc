import { maskEmail } from "@/lib/mask-contact";
import { loginOtpConfigForEmail } from "@/lib/login-otp-users";
import type { LoginOtpDeliveryMethod } from "@/lib/login-otp-types";
import { sendTransactionalEmail } from "@/server/email";
import { deliverLoginOtpViaWebhook, loginOtpWebhookConfigured } from "@/server/login-otp-webhook";
import { loginOtpSmsConfigured, sendLoginOtp } from "@/server/sms";
import { loginOtpWhatsAppConfigured, sendLoginOtpViaWhatsApp } from "@/server/whatsapp-otp";

export type LoginOtpDeliveryResult = {
  phoneMasked: string;
  deliveryMethod: LoginOtpDeliveryMethod;
  destinationMasked: string;
  demoOtp?: string;
};

function loginOtpProvidersConfigured() {
  const hasResend =
    Boolean(process.env.RESEND_API_KEY?.trim()) && Boolean(process.env.RESEND_FROM_EMAIL?.trim());
  return loginOtpSmsConfigured() || hasResend || loginOtpWhatsAppConfigured() || loginOtpWebhookConfigured();
}

function resolveDeliveryOrder(configOrder?: LoginOtpDeliveryMethod[]): LoginOtpDeliveryMethod[] {
  const fromEnv = process.env.LOGIN_OTP_DELIVERY_ORDER?.split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean) as LoginOtpDeliveryMethod[] | undefined;
  if (fromEnv?.length) return fromEnv;
  if (configOrder?.length) return configOrder;
  return ["webhook", "sms", "email"];
}

function loginOtpEmailHtml(code: string) {
  return `<p><strong>HSBC OTP: ${code}</strong></p>
<p>Your One-Time Password (OTP) is <strong>${code}</strong>. It is valid for 5 minutes. Please do not share this OTP with anyone.</p>`;
}

async function deliverBySms(phoneE164: string, code: string, body: string) {
  const result = await sendLoginOtp(phoneE164, code, body);
  return result.delivered && result.channel !== "log";
}

async function deliverByEmail(email: string, code: string, body: string) {
  const result = await sendTransactionalEmail({
    to: email,
    subject: `HSBC OTP: ${code}`,
    text: body,
    html: loginOtpEmailHtml(code),
  });
  return result.delivered;
}

/** Sends OTP for log on via WhatsApp, SMS, email, or webhook (see LOGIN_OTP_DELIVERY_ORDER). */
export async function deliverLoginOtp(email: string, code: string, smsBody: string): Promise<LoginOtpDeliveryResult> {
  const config = loginOtpConfigForEmail(email);
  if (!config) throw new Error("OTP not configured for this user");

  const order = resolveDeliveryOrder();

  for (const method of order) {
    if (method === "whatsapp") {
      try {
        const ok = await sendLoginOtpViaWhatsApp(config.phoneE164, smsBody);
        if (ok) {
          return {
            phoneMasked: config.phoneMasked,
            deliveryMethod: "whatsapp",
            destinationMasked: `WhatsApp ${config.phoneMasked}`,
          };
        }
      } catch (error) {
        console.error("[login-otp] WhatsApp delivery failed:", error);
      }
    }

    if (method === "sms") {
      try {
        const ok = await deliverBySms(config.phoneE164, code, smsBody);
        if (ok) {
          return {
            phoneMasked: config.phoneMasked,
            deliveryMethod: "sms",
            destinationMasked: config.phoneMasked,
          };
        }
      } catch (error) {
        console.error("[login-otp] SMS delivery failed:", error);
      }
    }

    if (method === "email") {
      try {
        const ok = await deliverByEmail(email, code, smsBody);
        if (ok) {
          return {
            phoneMasked: config.phoneMasked,
            deliveryMethod: "email",
            destinationMasked: maskEmail(email),
          };
        }
      } catch (error) {
        console.error("[login-otp] Email delivery failed:", error);
      }
    }

    if (method === "webhook") {
      try {
        const ok = await deliverLoginOtpViaWebhook({
          email,
          phoneE164: config.phoneE164,
          otp: code,
          message: smsBody,
        });
        if (ok) {
          return {
            phoneMasked: config.phoneMasked,
            deliveryMethod: "webhook",
            destinationMasked: config.phoneMasked,
          };
        }
      } catch (error) {
        console.error("[login-otp] Webhook delivery failed:", error);
      }
    }
  }

  if (process.env.DEMO_EXPOSE_LOGIN_OTP === "true") {
    return {
      phoneMasked: config.phoneMasked,
      deliveryMethod: "sms",
      destinationMasked: config.phoneMasked,
      demoOtp: code,
    };
  }

  if (!loginOtpProvidersConfigured()) {
    throw new Error(
      "Log on codes are not configured. On Vercel set one of: CALLMEBOT_API_KEY (WhatsApp), TWOFACTOR_API_KEY or MSG91_AUTH_KEY (SMS), RESEND_API_KEY (email), or LOGIN_OTP_WEBHOOK_URL.",
    );
  }

  throw new Error(
    `We could not deliver a code to ${config.phoneMasked}. Check API keys, CallMeBot WhatsApp activation, or SMS balance.`,
  );
}
