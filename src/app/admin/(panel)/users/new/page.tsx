"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/client";
import { Button, ErrorState, TextField } from "@/components/ui";

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: { id: string } }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          password: data.get("password"),
          balancePin: data.get("balancePin"),
          loginPin: data.get("loginPin"),
          openingBalance: data.get("openingBalance") || undefined,
        }),
      });
      router.replace(`/admin/users/${result.user.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not create the customer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">New customer</h1>
      <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        {error ? <ErrorState message={error} /> : null}
        <TextField label="Full name" name="fullName" required />
        <TextField label="Email" name="email" type="text" autoComplete="off" required />
        <TextField label="Phone" name="phone" />
        <TextField label="Temporary password" name="password" type="password" required />
        <TextField label="4-digit password" name="balancePin" inputMode="numeric" maxLength={4} pattern="\d{4}" required />
        <TextField label="6-digit log on PIN" name="loginPin" inputMode="numeric" maxLength={6} pattern="\d{6}" required />
        <TextField label="Opening balance" name="openingBalance" inputMode="decimal" placeholder="0.00" />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create customer"}</Button>
      </form>
    </div>
  );
}
