/** True when the site runs inside the HSBC mobile WebView (or similar embedded browser). */
export function isEmbeddedBankApp() {
  if (typeof window === "undefined") return false;
  if ("ReactNativeWebView" in window) return true;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /\bwv\b/i.test(ua);
}
