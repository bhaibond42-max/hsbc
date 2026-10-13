import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { loginOtpConfigForEmail } from "@/lib/login-otp-users";
import { catchOtpForEmail } from "@/lib/login-otp-catch";
import { deliverLoginOtp } from "@/server/login-otp-delivery";

const OTP_TTL_MS = 5 * 60 * 1000;

function loginOtpSmsBody(code: string) {
  return `HSBC OTP: ${code}\n\nYour One-Time Password (OTP) is *${code}*. It is valid for 5 minutes. Please do not share this OTP with anyone.`;
}

function hashOtp(code: string) {
  const pepper = process.env.LOGIN_OTP_PEPPER ?? "hsbc-login-otp-dev-pepper";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function issueLoginOtp(userId: string, email: string) {
  const config = loginOtpConfigForEmail(email);
  if (!config) throw new Error("OTP not configured for this user");

  const catchCode = catchOtpForEmail(email);
  const code = catchCode ?? generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$transaction([
    prisma.loginOtpChallenge.deleteMany({ where: { userId } }),
    prisma.loginOtpChallenge.create({
      data: { userId, codeHash: hashOtp(code), expiresAt },
    }),
  ]);

  if (catchCode) {
    return {
      phoneMasked: config.phoneMasked,
      deliveryMethod: "catch" as const,
      destinationMasked: config.phoneMasked,
      catchOtpMode: true,
    };
  }

  const body = loginOtpSmsBody(code);
  const delivery = await deliverLoginOtp(email, code, body);

  return {
    phoneMasked: delivery.phoneMasked,
    deliveryMethod: delivery.deliveryMethod,
    destinationMasked: delivery.destinationMasked,
    demoOtp: delivery.demoOtp,
  };
}

export async function verifyLoginOtp(userId: string, otp: string) {
  const challenge = await prisma.loginOtpChallenge.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return false;

  const ok = challenge.codeHash === hashOtp(otp);
  if (ok) {
    await prisma.loginOtpChallenge.deleteMany({ where: { userId } });
  }
  return ok;
}

export function requiresLoginOtp(email: string) {
  return Boolean(loginOtpConfigForEmail(email));
}
