"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, api } from "@/lib/client";
import { Button, Dialog, ErrorState, TextField } from "@/components/ui";

type BalancePrivacyContextValue = {
  hidden: boolean;
  toggle: () => void;
  busy: boolean;
};

const BalancePrivacyContext = createContext<BalancePrivacyContextValue | null>(null);

export function useBalancePrivacy() {
  const ctx = useContext(BalancePrivacyContext);
  if (!ctx) {
    return { hidden: false, toggle: () => undefined, busy: false };
  }
  return ctx;
}

export function BalancePrivacyToggle({ className }: { className?: string }) {
  const { hidden, toggle, busy } = useBalancePrivacy();
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={className}
      aria-label={hidden ? "Show balances" : "Hide balances"}
    >
      {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  );
}

export function BalancePrivacyProvider({
  initialHidden,
  notifyTransactions,
  notifyStatements,
  children,
}: {
  initialHidden: boolean;
  notifyTransactions: boolean;
  notifyStatements: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [askPin, setAskPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHidden(initialHidden);
  }, [initialHidden]);

  const patchSettings = useCallback(
    async (body: { hideBalances: boolean; pin?: string }) => {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          hideBalances: body.hideBalances,
          notifyTransactions,
          notifyStatements,
          pin: body.pin,
        }),
      });
      setHidden(body.hideBalances);
      router.refresh();
    },
    [notifyStatements, notifyTransactions, router],
  );

  async function applyHide() {
    setBusy(true);
    try {
      await patchSettings({ hideBalances: true });
    } catch {
      setHidden(initialHidden);
    } finally {
      setBusy(false);
    }
  }

  async function reveal(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setPinError("");
    try {
      await patchSettings({ hideBalances: false, pin });
      setAskPin(false);
      setPin("");
    } catch (cause) {
      setPinError(cause instanceof ApiError ? cause.message : "Could not show balances");
    } finally {
      setBusy(false);
    }
  }

  const toggle = useCallback(() => {
    if (busy) return;
    if (hidden) {
      setPin("");
      setPinError("");
      setAskPin(true);
      return;
    }
    void applyHide();
  }, [busy, hidden]);

  const value = useMemo(() => ({ hidden, toggle, busy }), [hidden, toggle, busy]);

  return (
    <BalancePrivacyContext.Provider value={value}>
      {children}
      <Dialog open={askPin} title="4-digit password" onClose={() => setAskPin(false)}>
        <form onSubmit={reveal} className="space-y-3">
          <p className="text-sm text-muted">Enter your 4-digit password to show balances (including overdrawn amounts).</p>
          {pinError ? <ErrorState message={pinError} /> : null}
          <TextField
            label="Password"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            minLength={4}
            maxLength={4}
            pattern="[0-9]{4}"
            placeholder="••••"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            required
          />
          <Button type="submit" className="w-full" disabled={busy || pin.length !== 4}>
            {busy ? "Checking…" : "Show balances"}
          </Button>
        </form>
      </Dialog>
    </BalancePrivacyContext.Provider>
  );
}
