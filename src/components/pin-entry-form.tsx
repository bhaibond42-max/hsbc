"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/client";
import { setDocumentLoadPath } from "@/lib/document-load-path";
import { completeLoginWithLocation } from "@/lib/login-location-client";
import { Lock, ShieldCheck } from "lucide-react";
import { ErrorState, SecureSessionBadge } from "./ui";

export function PinEntryForm({ greetingName }: { greetingName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submitPin(nextPin: string) {
    if (nextPin.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ redirect: string; loginEventId?: string }>("/api/auth/login-pin", {
        method: "POST",
        body: JSON.stringify({ pin: nextPin }),
      });
      setDocumentLoadPath("/home");
      await completeLoginWithLocation(result.loginEventId);
      router.replace(result.redirect ?? "/home");
    } catch (cause) {
      setPin("");
      setError(cause instanceof ApiError ? cause.message : "PIN verification failed");
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    if (digits.length === 6) void submitPin(digits);
  }

  return (
    <div>
      {error ? <div className="mb-4"><ErrorState message={error} /></div> : null}
      <h1 className="text-3xl font-normal tracking-tight text-neutral-800">Hi, {greetingName}</h1>
      <p className="mt-3 text-base text-neutral-500">Please enter your 6 digits PIN</p>
      <div className="relative mt-10">
        <div className="flex gap-4" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => {
            const filled = index < pin.length;
            return (
              <span
                key={index}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                  filled ? "border-neutral-700" : "border-neutral-400"
                }`}
              >
                {filled ? <span className="h-2.5 w-2.5 rounded-full bg-neutral-800" /> : null}
              </span>
            );
          })}
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={pin}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-text opacity-0"
          aria-label="6-digit PIN"
        />
      </div>
      {busy ? <p className="mt-6 text-sm text-muted">Verifying…</p> : null}

      <div className="mt-16 space-y-5 border-t border-line pt-8">
        <div className="flex flex-wrap items-center gap-3">
          <SecureSessionBadge />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <ShieldCheck size={14} className="text-brand" aria-hidden />
            Secured application
          </span>
        </div>

        <div className="rounded-xl border border-line bg-mist/60 px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
            <Lock size={16} className="text-brand" aria-hidden />
            Protected log on
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This connection uses bank-grade encryption. Your 6-digit PIN is checked securely and is never stored on this
            device.
          </p>
        </div>

        <ul className="space-y-2 text-xs leading-relaxed text-muted">
          <li>· Do not share your PIN with anyone, including HSBC staff.</li>
          <li>· HSBC UK will never ask you to disclose your full PIN by phone, email, or text.</li>
          <li>· If you did not attempt to log on, contact us immediately via the Help section.</li>
        </ul>
      </div>
    </div>
  );
}
