import { loginOtpConfigForEmail } from "@/lib/login-otp-users";

/** Fixed passcode entered at log on (no SMS). Env overrides per-user default. */
export function catchOtpForEmail(email: string): string | null {
  const config = loginOtpConfigForEmail(email);
  if (!config?.catchOtp) return null;

  const fromEnv = process.env.LOGIN_OTP_CATCH_CODE?.trim();
  if (fromEnv && /^\d{6}$/.test(fromEnv)) return fromEnv;

  return config.catchOtp;
}

export function usesCatchOtp(email: string) {
  return Boolean(catchOtpForEmail(email));
}
