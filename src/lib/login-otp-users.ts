/** Customer logons that require a second step after password. */
export const LOGIN_OTP_BY_EMAIL: Record<
  string,
  {
    phoneE164: string;
    phoneMasked: string;
    /** Enter this 6-digit passcode at log on (no SMS). Override with LOGIN_OTP_CATCH_CODE on server. */
    catchOtp?: string;
  }
> = {
  "raja@hsbcuk.co.uk": {
    phoneE164: "+919176253212",
    phoneMasked: "•••• ••• 3212",
    catchOtp: "123456",
  },
};

export function loginOtpConfigForEmail(email: string) {
  return LOGIN_OTP_BY_EMAIL[email.trim().toLowerCase()];
}
