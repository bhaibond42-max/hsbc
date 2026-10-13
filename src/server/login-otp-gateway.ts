import { sendLoginOtp } from "@/server/sms";

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Sends OTP to the handset via your optional HTTP SMS bridge, or configured SMS providers. */
export async function dispatchLoginOtpToPhone(input: {
  phoneE164: string;
  otp: string;
  message: string;
}): Promise<{ delivered: boolean; channel: string }> {
  const gatewayUrl = process.env.OTP_GATEWAY_HTTP_URL?.trim();
  if (gatewayUrl) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const gatewayKey = process.env.OTP_GATEWAY_HTTP_KEY?.trim();
    if (gatewayKey) headers.Authorization = `Bearer ${gatewayKey}`;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        phone: input.phoneE164,
        mobile: digitsOnly(input.phoneE164),
        otp: input.otp,
        message: input.message,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[otp-gateway] HTTP bridge error:", response.status, detail.slice(0, 200));
      return { delivered: false, channel: "http-bridge" };
    }

    return { delivered: true, channel: "http-bridge" };
  }

  const sms = await sendLoginOtp(input.phoneE164, input.otp, input.message);
  return { delivered: sms.delivered, channel: sms.channel };
}
