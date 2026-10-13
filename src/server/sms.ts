export type SmsChannel = "twilio" | "msg91" | "twofactor" | "fast2sms" | "log";

export type SendSmsResult = { delivered: boolean; channel: SmsChannel };

function digitsOnly(e164: string) {
  return e164.replace(/\D/g, "");
}

function indianMobile10(e164: string) {
  const d = digitsOnly(e164);
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 10) return d;
  throw new Error("Invalid Indian mobile number for SMS");
}

function mobileWithCountryCode(e164: string) {
  const d = digitsOnly(e164);
  if (d.length === 10) return `91${d}`;
  return d;
}

async function sendViaTwilio(to: string, body: string): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio is not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[sms] Twilio error:", response.status, detail.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }

  return { delivered: true, channel: "twilio" };
}

const MSG91_DEFAULT_OTP_MESSAGE =
  "HSBC OTP: ##OTP##. Your One-Time Password (OTP) is ##OTP##. It is valid for 5 minutes. Please do not share this OTP with anyone.";

function parseMsg91Response(raw: string) {
  let parsed: { type?: string; message?: string } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    console.error("[sms] MSG91 invalid JSON:", raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }
  if (parsed.type !== "success") {
    console.error("[sms] MSG91 error:", parsed.message ?? raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }
}

/** MSG91 v5 OTP — use when MSG91_TEMPLATE_ID is set (DLT template from MSG91 panel). */
async function sendViaMsg91V5(to: string, code: string, authkey: string, templateId: string): Promise<SendSmsResult> {
  const mobile = mobileWithCountryCode(to);
  const query = new URLSearchParams({
    mobile,
    otp: code,
    otp_expiry: "5",
    otp_length: "6",
    template_id: templateId,
    realTimeResponse: "1",
  });

  const response = await fetch(`https://control.msg91.com/api/v5/otp?${query.toString()}`, {
    method: "POST",
    headers: {
      authkey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const raw = await response.text().catch(() => "");
  parseMsg91Response(raw);
  return { delivered: true, channel: "msg91" };
}

/** MSG91 legacy Send OTP — works with auth key only: https://api.msg91.com/apidoc/sendotp/send-otp.php */
async function sendViaMsg91Legacy(to: string, code: string, authkey: string): Promise<SendSmsResult> {
  const mobile = mobileWithCountryCode(to);
  const params = new URLSearchParams({
    authkey,
    mobile,
    otp: code,
    otp_expiry: "5",
    otp_length: "6",
    message: process.env.MSG91_OTP_MESSAGE?.trim() ?? MSG91_DEFAULT_OTP_MESSAGE,
  });

  const sender = process.env.MSG91_SENDER_ID?.trim();
  if (sender) params.set("sender", sender);

  const response = await fetch(`https://api.msg91.com/api/sendotp.php?${params.toString()}`);
  const raw = await response.text().catch(() => "");
  parseMsg91Response(raw);
  return { delivered: true, channel: "msg91" };
}

async function sendViaMsg91(to: string, code: string): Promise<SendSmsResult> {
  const authkey = process.env.MSG91_AUTH_KEY?.trim();
  if (!authkey) throw new Error("MSG91 is not configured");

  const templateId = process.env.MSG91_TEMPLATE_ID?.trim();
  if (templateId) return sendViaMsg91V5(to, code, authkey, templateId);
  return sendViaMsg91Legacy(to, code, authkey);
}

/** 2Factor.in — https://2factor.in/API/DOCS/SMS_OTP.html */
async function sendVia2Factor(to: string, code: string): Promise<SendSmsResult> {
  const apiKey = process.env.TWOFACTOR_API_KEY?.trim();
  if (!apiKey) throw new Error("2Factor is not configured");

  const phone = mobileWithCountryCode(to);
  const template = process.env.TWOFACTOR_TEMPLATE_NAME?.trim();
  const path = template
    ? `/API/V1/${encodeURIComponent(apiKey)}/SMS/${phone}/${code}/${encodeURIComponent(template)}`
    : `/API/V1/${encodeURIComponent(apiKey)}/SMS/${phone}/${code}`;

  const response = await fetch(`https://2factor.in${path}`, { method: "GET" });
  const raw = await response.text().catch(() => "");

  let parsed: { Status?: string; status?: string; Details?: string; message?: string } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    console.error("[sms] 2Factor invalid JSON:", raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }

  const ok =
    parsed.Status === "Success" ||
    parsed.status === "Success" ||
    parsed.status === "sent" ||
    parsed.Status === "sent";

  if (!ok) {
    console.error("[sms] 2Factor error:", parsed.Details ?? parsed.message ?? raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }

  return { delivered: true, channel: "twofactor" };
}

function parseFast2SmsResponse(raw: string, httpStatus: number) {
  if (!httpStatus || httpStatus >= 400) {
    console.error("[sms] Fast2SMS HTTP error:", httpStatus, raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }

  let parsed: { return?: boolean; message?: string | string[] } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    console.error("[sms] Fast2SMS invalid JSON:", raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }

  if (parsed.return !== true) {
    const msg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
    console.error("[sms] Fast2SMS error:", msg ?? raw.slice(0, 300));
    throw new Error("Could not send the verification text message");
  }
}

async function sendViaFast2SmsOtpSend(to: string, code: string): Promise<SendSmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY?.trim();
  const otpId = process.env.FAST2SMS_OTP_ID?.trim();
  if (!apiKey || !otpId) throw new Error("Fast2SMS OTP API is not configured");

  const mobile = indianMobile10(to);
  const payload: Record<string, string | number> = {
    mobile,
    otp_id: otpId,
    otp: code,
    otp_expiry: 5,
    otp_length: 6,
  };

  const variables = process.env.FAST2SMS_OTP_VARIABLES?.trim();
  if (variables) payload.variables_values = variables;

  const response = await fetch("https://www.fast2sms.com/dev/otp/send", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text().catch(() => "");
  parseFast2SmsResponse(raw, response.status);
  return { delivered: true, channel: "fast2sms" };
}

async function sendViaFast2SmsBulkOtp(to: string, code: string): Promise<SendSmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY?.trim();
  if (!apiKey) throw new Error("Fast2SMS is not configured");

  const numbers = digitsOnly(to);
  const payload = new URLSearchParams({
    route: "otp",
    variables_values: code,
    numbers,
    flash: "0",
  });

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  const raw = await response.text().catch(() => "");
  parseFast2SmsResponse(raw, response.status);
  return { delivered: true, channel: "fast2sms" };
}

type SmsProviderId = "twilio" | "msg91" | "twofactor" | "fast2sms";

function configuredSmsProviders(): SmsProviderId[] {
  const defaultOrder: SmsProviderId[] = ["twofactor", "msg91", "twilio", "fast2sms"];
  const fromEnv = process.env.LOGIN_OTP_SMS_PROVIDERS?.split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean) as SmsProviderId[] | undefined;
  const order = fromEnv?.length ? fromEnv : defaultOrder;

  const has = {
    twilio:
      Boolean(process.env.TWILIO_ACCOUNT_SID) &&
      Boolean(process.env.TWILIO_AUTH_TOKEN) &&
      Boolean(process.env.TWILIO_FROM_NUMBER),
    msg91: Boolean(process.env.MSG91_AUTH_KEY?.trim()),
    twofactor: Boolean(process.env.TWOFACTOR_API_KEY?.trim()),
    fast2sms: Boolean(process.env.FAST2SMS_API_KEY?.trim()),
  };

  return order.filter((id) => has[id]);
}

/** Sends login OTP via the first configured provider that succeeds (MSG91, 2Factor, Twilio, or Fast2SMS). */
export async function sendLoginOtp(to: string, code: string, smsBody: string): Promise<SendSmsResult> {
  const providers = configuredSmsProviders();
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      if (provider === "twilio") return await sendViaTwilio(to, smsBody);
      if (provider === "msg91") return await sendViaMsg91(to, code);
      if (provider === "twofactor") return await sendVia2Factor(to, code);
      if (provider === "fast2sms") {
        const otpId = process.env.FAST2SMS_OTP_ID?.trim();
        if (otpId) return await sendViaFast2SmsOtpSend(to, code);
        return await sendViaFast2SmsBulkOtp(to, code);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      errors.push(`${provider}: ${msg}`);
      console.error(`[sms] ${provider} failed:`, error);
    }
  }

  if (providers.length === 0) {
    console.info(`[sms] (no SMS provider configured) To ${to}`);
  } else {
    console.error("[sms] All providers failed:", errors.join("; "));
  }

  return { delivered: false, channel: "log" };
}

export function loginOtpSmsConfigured() {
  return configuredSmsProviders().length > 0;
}
