import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginOtpConfigForEmail } from "@/lib/login-otp-users";
import { dispatchLoginOtpToPhone } from "@/server/login-otp-gateway";

const payloadSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  otp: z.string().regex(/^\d{6}$/),
  message: z.string().min(1).max(500),
});

function normalizePhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  return d;
}

function verifyWebhookSecret(req: NextRequest) {
  const expected = process.env.LOGIN_OTP_WEBHOOK_SECRET?.trim();
  if (!expected) return false;

  const provided = req.headers.get("x-webhook-secret")?.trim() ?? "";
  if (!provided) return false;

  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Built-in SMS gateway: validates webhook secret and sends OTP to the registered mobile. */
export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  let body: z.infer<typeof payloadSchema>;
  try {
    body = payloadSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const config = loginOtpConfigForEmail(body.email);
  if (!config) {
    return NextResponse.json({ error: "Unknown OTP user" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  if (normalizePhone(config.phoneE164) !== normalizePhone(body.phone)) {
    return NextResponse.json({ error: "Phone not allowed for this account" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await dispatchLoginOtpToPhone({
      phoneE164: config.phoneE164,
      otp: body.otp,
      message: body.message,
    });

    if (!result.delivered) {
      return NextResponse.json(
        {
          error:
            "Could not send SMS. Add TWOFACTOR_API_KEY or MSG91_AUTH_KEY on Vercel, or set OTP_GATEWAY_HTTP_URL to your SMS server.",
          channel: result.channel,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: true, channel: result.channel }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[webhook] dispatch-login-otp failed:", error);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
