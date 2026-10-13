"use client";

import { PageHeader } from "./ui";

export function SettingsScreen({
  hideBalances,
  notifyTransactions,
  notifyStatements,
}: {
  hideBalances: boolean;
  notifyTransactions: boolean;
  notifyStatements: boolean;
}) {
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-sm leading-relaxed text-muted">
          Your preferences are managed by HSBC UK. Contact your branch or use secure messaging in live banking to request
          changes to alerts or personal details.
        </p>
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <h3 className="px-4 pt-4 text-sm font-semibold">Display and alerts</h3>
          <dl className="mt-2">
            <Row label="Hide balances" value={hideBalances ? "On" : "Off"} />
            <Row label="Transaction alerts" value={notifyTransactions ? "On" : "Off"} />
            <Row label="Statement alerts" value={notifyStatements ? "On" : "Off"} />
          </dl>
        </section>
        <section className="rounded-2xl bg-mist px-4 py-3 text-sm text-muted">
          You can show or hide balances on the home screen using the eye control. Other settings cannot be updated in this
          app.
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
