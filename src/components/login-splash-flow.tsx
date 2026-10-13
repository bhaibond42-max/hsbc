"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { consumeSkipLoginSplash, getDocumentLoadPath } from "@/lib/document-load-path";
import { LoginForm } from "@/components/auth-forms";
import { HsbcLogo } from "@/components/logo";
import { OpeningSplashScreen } from "@/components/opening-brand-logo";
import { SecureSessionBadge } from "@/components/ui";

type Phase = "splash" | "signin";

function shouldShowOpeningSplash(): boolean {
  if (consumeSkipLoginSplash()) return false;

  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const loadPath = getDocumentLoadPath();

  if (loadPath && loadPath !== "/login") return false;

  return entry?.type === "reload" || entry?.type === "navigate";
}

export function LoginPageClient() {
  const [phase, setPhase] = useState<Phase>(() => (shouldShowOpeningSplash() ? "splash" : "signin"));

  useEffect(() => {
    if (phase !== "splash") return;

    let cancelled = false;

    async function run() {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      if (cancelled) return;
      await api("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
      if (cancelled) return;
      setPhase("signin");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  if (phase === "splash") {
    return <OpeningSplashScreen />;
  }

  return (
    <main className="min-h-dvh bg-mist">
      <header className="bg-brand px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <HsbcLogo onDark size={72} />
          <SecureSessionBadge />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="hidden lg:block">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Personal banking</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-charcoal">Welcome to HSBC UK</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Log on to view accounts, make payments, and manage your money securely with HSBC UK online banking.
          </p>
          <div className="mt-8 h-px w-16 bg-brand" aria-hidden />
        </div>

        <div className="panel mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="lg:hidden">
            <HsbcLogo size={56} />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-charcoal">Welcome to HSBC UK</h1>
            <p className="mt-2 text-sm text-muted">Log on to online banking.</p>
          </div>
          <div className="mt-6 lg:mt-0">
            <h2 className="sr-only">Log on</h2>
            <LoginForm />
          </div>
          <p className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            <Link href="/help" className="hover:text-charcoal hover:underline">
              Help
            </Link>
            {" · "}
            <Link href="/help#terms-and-conditions" className="hover:text-charcoal hover:underline">
              Terms and conditions
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
