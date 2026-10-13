"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, MapPin, RefreshCw, Smartphone, Trash2, Wifi } from "lucide-react";
import { ApiError, api } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
import { Button, Card } from "./ui";

export type LoginMonitorRow = {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  ipAddress: string | null;
  userAgent: string | null;
  ipLocationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationLabel: string | null;
  geoStatus: string | null;
  createdAt: string;
};

function deviceHint(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iPhone / iPad";
  if (ua.includes("mobile")) return "Mobile browser";
  return "Desktop browser";
}

function geoBadge(status: string | null) {
  switch (status) {
    case "granted":
      return { label: "GPS locked", className: "bg-emerald-100 text-emerald-800" };
    case "pending":
      return { label: "Awaiting GPS", className: "bg-amber-100 text-amber-900" };
    case "denied":
      return { label: "GPS denied", className: "bg-neutral-200 text-neutral-700" };
    case "timeout":
      return { label: "GPS timeout", className: "bg-orange-100 text-orange-900" };
    default:
      return { label: "IP only", className: "bg-sky-100 text-sky-900" };
  }
}

function mapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function AdminLoginMonitor({ initial }: { initial: LoginMonitorRow[] }) {
  const [events, setEvents] = useState(initial);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ events: LoginMonitorRow[]; fetchedAt: string }>("/api/admin/login-monitor");
      setEvents(data.events);
      setFetchedAt(data.fetchedAt);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not refresh monitor");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function deleteOne(event: LoginMonitorRow) {
    if (!window.confirm(`Delete this log on record for ${event.fullName}?`)) return;
    setDeletingId(event.id);
    setError("");
    try {
      await api("/api/admin/login-monitor/" + event.id, {
        method: "DELETE",
        body: JSON.stringify({ reason: "Removed from log on monitor by staff" }),
      });
      setEvents((current) => current.filter((row) => row.id !== event.id));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not delete event");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAll() {
    if (events.length === 0) return;
    if (
      !window.confirm(
        `Delete all ${events.length} log on monitor record${events.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setClearingAll(true);
    setError("");
    try {
      await api<{ ok: boolean; deleted: number }>("/api/admin/login-monitor", {
        method: "DELETE",
        body: JSON.stringify({ reason: "Log on monitor cleared by staff" }),
      });
      setEvents([]);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not clear monitor");
    } finally {
      setClearingAll(false);
    }
  }

  const liveCount = events.filter((e) => {
    const age = Date.now() - new Date(e.createdAt).getTime();
    return age < 15 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Live monitor
          </span>
          <span className="text-sm text-muted">
            {liveCount} session{liveCount === 1 ? "" : "s"} in last 15 min
            {fetchedAt ? ` · updated ${formatDateTime(fetchedAt)}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={busy || clearingAll || deletingId != null || events.length === 0}
            onClick={() => void deleteAll()}
          >
            <Trash2 size={16} />
            Delete all
          </Button>
          <Button type="button" variant="secondary" disabled={busy || clearingAll} onClick={() => void refresh()}>
            <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">IP address</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No customer log on events yet. Events appear when a user completes log on.
                  </td>
                </tr>
              ) : null}
              {events.map((event) => {
                const badge = geoBadge(event.geoStatus);
                const hasGps = event.geoStatus === "granted" && event.latitude != null && event.longitude != null;
                const locationText =
                  event.locationLabel ??
                  (hasGps ? `${event.latitude!.toFixed(4)}, ${event.longitude!.toFixed(4)}` : event.ipLocationLabel) ??
                  "—";
                return (
                  <tr key={event.id} className="border-b border-line align-top last:border-b-0 hover:bg-mist/40">
                    <td className="px-4 py-3 text-muted">{formatDateTime(event.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-charcoal">{event.fullName}</span>
                      <span className="text-xs text-muted">{event.email}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-charcoal">{event.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-start gap-1.5 text-charcoal">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span>
                          {locationText}
                          {hasGps ? (
                            <a
                              href={mapsUrl(event.latitude!, event.longitude!)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-xs font-medium text-brand hover:underline"
                            >
                              Open map
                            </a>
                          ) : null}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        {deviceHint(event.userAgent).includes("Mobile") || deviceHint(event.userAgent).includes("Android") || deviceHint(event.userAgent).includes("iPhone") ? (
                          <Smartphone size={14} />
                        ) : (
                          <Wifi size={14} />
                        )}
                        {deviceHint(event.userAgent)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="danger"
                        className="h-9 px-3 text-xs"
                        disabled={clearingAll || deletingId === event.id}
                        onClick={() => void deleteOne(event)}
                      >
                        {deletingId === event.id ? "Deleting…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Activity size={14} />
        Auto-refreshes every 8 seconds. GPS requires the customer to allow location in the browser; IP region is estimated when they log on.
      </p>
    </div>
  );
}
