"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, Globe2, Palette, Shield } from "lucide-react";
import { clsx } from "clsx";
import {
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  type AppColourTheme,
  type AppLanguage,
  readStoredLanguage,
  readStoredTheme,
  writeStoredLanguage,
  writeStoredTheme,
} from "@/lib/app-preferences";
import { formatGBP } from "@/lib/money";
import { USER_PORTAL_VIEW_ONLY } from "@/lib/user-access";

export type ProfileLimits = {
  accountName: string;
  dailyCardLimit: string;
  onlinePaymentLimit: string;
};

export function ProfileSettingsSection({
  limits,
  hideBalances,
  notifyTransactions,
  notifyStatements,
  embedded,
}: {
  limits: ProfileLimits;
  hideBalances: boolean;
  notifyTransactions: boolean;
  notifyStatements: boolean;
  embedded?: boolean;
}) {
  const [language, setLanguage] = useState<AppLanguage>("en-GB");
  const [theme, setTheme] = useState<AppColourTheme>("light");

  useEffect(() => {
    setLanguage(readStoredLanguage());
    setTheme(readStoredTheme());
  }, []);

  function onLanguageChange(next: AppLanguage) {
    if (USER_PORTAL_VIEW_ONLY) return;
    setLanguage(next);
    writeStoredLanguage(next);
  }

  function onThemeChange(next: AppColourTheme) {
    if (USER_PORTAL_VIEW_ONLY) return;
    setTheme(next);
    writeStoredTheme(next);
  }

  const content = (
    <>
      <PremiumPanel
        icon={Shield}
        title="Manage limits"
        description="Spending and payment ceilings on your account."
      >
        <dl className="divide-y divide-line/80">
          <SettingsRow label="Account" value={limits.accountName} />
          <SettingsRow label="Debit card daily limit" value={`${formatGBP(limits.dailyCardLimit)}/day`} />
          <SettingsRow label="Online payment limit" value={formatGBP(limits.onlinePaymentLimit)} />
        </dl>
        <div className="mt-4 flex flex-col gap-2 border-t border-line/80 pt-4">
          <SettingsLink href="/cards" label="Manage card limits" />
          <SettingsLink href="/explore/card-limits" label="View limit details" />
        </div>
      </PremiumPanel>

      <PremiumPanel icon={Globe2} title="Language" description="Regional language for menus and labels.">
        <div className="grid gap-3">
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onLanguageChange(option.id)}
                className={clsx(
                  "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition",
                  active
                    ? "border-brand/40 bg-gradient-to-r from-brand/10 to-transparent shadow-sm ring-1 ring-brand/20"
                    : "border-line bg-surface hover:border-line-strong hover:shadow-sm",
                )}
              >
                <span
                  className={clsx(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold tracking-wide",
                    active ? "bg-brand text-white" : "bg-mist text-charcoal",
                  )}
                >
                  {option.badge}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-charcoal">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{option.subtitle}</span>
                </span>
                {active ? <Check size={20} className="shrink-0 text-brand" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {USER_PORTAL_VIEW_ONLY ? "Display language is fixed in this view-only app." : "Preference is saved on this device only."}
        </p>
      </PremiumPanel>

      <PremiumPanel icon={Palette} title="Colour theme" description="Personalise contrast and brand presence.">
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const active = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onThemeChange(option.id)}
                className={clsx(
                  "group relative overflow-hidden rounded-xl border p-3 text-left transition",
                  active ? "border-brand ring-2 ring-brand/25 shadow-md" : "border-line hover:border-line-strong hover:shadow-sm",
                )}
              >
                <div
                  className="h-16 rounded-lg border border-white/40 shadow-inner"
                  style={{ background: option.preview }}
                  aria-hidden
                />
                <p className="mt-3 text-sm font-semibold text-charcoal">{option.label}</p>
                <p className="mt-1 text-xs leading-snug text-muted">{option.hint}</p>
                {active ? (
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand text-white shadow">
                    <Check size={14} aria-hidden />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PremiumPanel>

      <PremiumPanel title="Display and alerts" description="Read-only preferences held on your profile.">
        <dl className="divide-y divide-line/80">
          <SettingsRow label="Hide balances" value={hideBalances ? "On" : "Off"} />
          <SettingsRow label="Transaction alerts" value={notifyTransactions ? "On" : "Off"} />
          <SettingsRow label="Statement alerts" value={notifyStatements ? "On" : "Off"} />
        </dl>
        <p className="mt-3 text-xs text-muted">Use the eye icon in the header or on Home to hide or show balances with your 4-digit password.</p>
      </PremiumPanel>
    </>
  );

  if (embedded) {
    return <div id="settings" className="scroll-mt-20 space-y-5">{content}</div>;
  }

  return content;
}

function PremiumPanel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: typeof Globe2;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card">
      <div className="border-b border-line/80 bg-gradient-to-r from-mist/80 to-surface px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon size={20} aria-hidden />
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-charcoal">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5"
    >
      {label}
      <ChevronRight size={16} aria-hidden />
    </Link>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="max-w-[58%] text-right text-sm font-medium text-charcoal">{value}</dd>
    </div>
  );
}
