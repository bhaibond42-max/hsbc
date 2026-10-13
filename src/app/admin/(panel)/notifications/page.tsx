"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/client";
import { Button, ErrorState, TextField } from "@/components/ui";
import { useToast } from "@/components/providers";

export default function AdminNotificationsPage() {
  const toast = useToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ recipients: number }>("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          target: data.get("target") || "ALL",
          type: data.get("type"),
          title: data.get("title"),
          body: data.get("body"),
        }),
      });
      toast(`Sent to ${result.recipients} customers`);
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Send a notification</h1>
      <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-line">
        {error ? <ErrorState message={error} /> : null}
        <TextField label="Customer id, or leave as ALL" name="target" defaultValue="ALL" />
        <label className="block text-sm font-medium">
          Type
          <select name="type" className="mt-1 h-12 w-full rounded-lg border border-line px-3" defaultValue="INFO">
            <option value="INFO">Info</option>
            <option value="TRANSACTION">Transaction</option>
            <option value="SECURITY">Security</option>
            <option value="STATEMENT">Statement</option>
          </select>
        </label>
        <TextField label="Title" name="title" required />
        <label className="block text-sm font-medium">
          Message
          <textarea name="body" required className="mt-1 min-h-28 w-full rounded-lg border border-line px-3 py-2" />
        </label>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
      </form>
    </div>
  );
}
