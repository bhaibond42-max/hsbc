import { USER_PORTAL_VIEW_ONLY } from "@/lib/user-access";

export type AppLanguage = "en-GB" | "en-US" | "cy-GB";
export type AppColourTheme = "light" | "dark" | "hsbc";

export const LANGUAGE_OPTIONS: { id: AppLanguage; label: string; subtitle: string; badge: string }[] = [
  { id: "en-GB", label: "English (UK)", subtitle: "Default HSBC UK experience", badge: "UK" },
  { id: "en-US", label: "English (US)", subtitle: "US spelling and formats", badge: "US" },
  { id: "cy-GB", label: "Cymraeg", subtitle: "Welsh language preference", badge: "CY" },
];

export const THEME_OPTIONS: { id: AppColourTheme; label: string; hint: string; preview: string }[] = [
  { id: "light", label: "Pearl", hint: "Clean white surfaces with soft grey depth", preview: "linear-gradient(135deg,#ffffff 0%,#f4f5f7 100%)" },
  { id: "dark", label: "Onyx", hint: "Deep charcoal for evening banking", preview: "linear-gradient(135deg,#1a1f2a 0%,#0f1218 100%)" },
  { id: "hsbc", label: "Heritage", hint: "HSBC red accents on warm ivory", preview: "linear-gradient(135deg,#fff5f5 0%,#fde8e8 50%,#ba1110 100%)" },
];

const LANGUAGE_KEY = "hsbc-app-language";
const THEME_KEY = "hsbc-app-theme";

export function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en-GB";
  const value = localStorage.getItem(LANGUAGE_KEY);
  return LANGUAGE_OPTIONS.some((o) => o.id === value) ? (value as AppLanguage) : "en-GB";
}

export function writeStoredLanguage(language: AppLanguage) {
  if (USER_PORTAL_VIEW_ONLY) return;
  localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language.startsWith("cy") ? "cy" : language.startsWith("en-US") ? "en-US" : "en-GB";
}

export function readStoredTheme(): AppColourTheme {
  if (typeof window === "undefined") return "light";
  const value = localStorage.getItem(THEME_KEY);
  return THEME_OPTIONS.some((o) => o.id === value) ? (value as AppColourTheme) : "light";
}

export function writeStoredTheme(theme: AppColourTheme) {
  if (USER_PORTAL_VIEW_ONLY) return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function applyStoredAppPreferences() {
  writeStoredTheme(readStoredTheme());
  writeStoredLanguage(readStoredLanguage());
}
