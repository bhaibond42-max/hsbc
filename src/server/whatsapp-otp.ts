/** Free personal WhatsApp alerts — https://www.callmebot.com/blog/free-api-whatsapp-messages/ */
export async function sendLoginOtpViaWhatsApp(phoneE164: string, message: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (!apiKey) return false;

  const phone = phoneE164.replace(/\D/g, "");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(message)}`;

  const response = await fetch(url);
  const raw = await response.text().catch(() => "");

  if (!response.ok) {
    console.error("[whatsapp] CallMeBot HTTP error:", response.status, raw.slice(0, 200));
    return false;
  }

  const ok = raw.toLowerCase().includes("sent") || raw.toLowerCase().includes("success");
  if (!ok) {
    console.error("[whatsapp] CallMeBot response:", raw.slice(0, 200));
    return false;
  }

  return true;
}

export function loginOtpWhatsAppConfigured() {
  return Boolean(process.env.CALLMEBOT_API_KEY?.trim());
}
