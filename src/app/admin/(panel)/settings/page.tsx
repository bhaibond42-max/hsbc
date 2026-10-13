"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/client";
import { Button, ErrorState, TextField } from "@/components/ui";
import { useToast } from "@/components/providers";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [error, setError] = useState("");

  async function enable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/api/admin/security-code", {
        method: "POST",
        body: JSON.stringify({ code: data.get("code"), password: data.get("password") }),
      });
      toast("Staff code saved. It will be asked at the next log on.");
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not save the code");
    }
  }

  async function disable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/api/admin/security-code", { method: "DELETE", body: JSON.stringify({ password: data.get("password") }) });
      toast("Staff code removed");
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not remove the code");
    }
  }

  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword") }),
      });
      toast("Password updated");
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not change the password");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Staff settings</h1>
      {error ? <ErrorState message={error} /> : null}
      <form onSubmit={enable} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Optional staff code</h2>
        <p className="text-sm text-neutral-500">A 6-digit code asked after the password.</p>
        <TextField label="6-digit code" name="code" inputMode="numeric" minLength={6} maxLength={6} required />
        <TextField label="Current password" name="password" type="password" required />
        <Button type="submit" className="w-full">Save staff code</Button>
      </form>
      <form onSubmit={disable} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Remove staff code</h2>
        <TextField label="Current password" name="password" type="password" required />
        <Button type="submit" variant="secondary" className="w-full">Remove</Button>
      </form>
      <form onSubmit={password} className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-semibold">Password</h2>
        <TextField label="Current password" name="currentPassword" type="password" required />
        <TextField label="New password" name="newPassword" type="password" required />
        <Button type="submit" variant="secondary" className="w-full">Change password</Button>
      </form>
    </div>
  );
}
