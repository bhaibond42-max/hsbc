"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import type { CustomerProfileView } from "@/lib/customer-profile";
import { api } from "@/lib/client";
import { ProfileSettingsSection, type ProfileLimits } from "./profile-settings-section";
import { Button, PageHeader, StatusBadge } from "./ui";

type ProfileMeta = {
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  hideBalances: boolean;
  notifyTransactions: boolean;
  notifyStatements: boolean;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium">{value || "Not added"}</dd>
    </div>
  );
}

function DetailSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <h3 className="px-4 pt-4 text-sm font-semibold">{title}</h3>
      <p className="px-4 pb-2 text-xs text-muted">{description}</p>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export function ProfileScreen({
  meta,
  profile,
  limits,
}: {
  meta: ProfileMeta;
  profile: CustomerProfileView;
  limits: ProfileLimits;
}) {
  const router = useRouter();
  const { personal, professional } = profile;
  const homeAddress = [personal.addressLine, personal.city, personal.postcode].filter(Boolean).join(", ");
  const workAddress = [professional.workAddressLine, professional.workCity, professional.workPostcode].filter(Boolean).join(", ");

  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="space-y-4 px-5 pb-8">
        <section className="rounded-2xl bg-white p-5 text-center ring-1 ring-line">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral-950 text-lg font-semibold text-white">
            {initials(meta.fullName)}
          </div>
          <h2 className="mt-3 text-xl font-semibold">{meta.fullName}</h2>
          <p className="text-sm text-neutral-500">{meta.email}</p>
          <div className="mt-3">
            <StatusBadge status={meta.status} />
          </div>
          <p className="mt-2 text-xs text-neutral-400">Customer since {formatDate(meta.createdAt)}</p>
        </section>

        <section className="rounded-2xl bg-brand/5 px-4 py-3 ring-1 ring-brand/15">
          <h3 className="text-sm font-semibold text-charcoal">Manage my profile</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            View your personal and professional details held by HSBC UK. To change this information, contact your branch or
            ask your relationship manager — updates are made by HSBC staff.
          </p>
        </section>

        <DetailSection title="Personal details" description="Your contact and identity information.">
          <Row label="Full name" value={personal.fullName} />
          <Row label="Email" value={personal.email} />
          <Row label="Mobile" value={personal.phone} />
          <Row label="Date of birth" value={personal.dateOfBirth ? formatDate(personal.dateOfBirth) : ""} />
          <Row label="Nationality" value={personal.nationality} />
          <Row label="Marital status" value={personal.maritalStatus} />
          <Row label="Home address" value={homeAddress} />
          <Row label="Occupation" value={personal.occupation} />
        </DetailSection>

        <DetailSection title="Professional details" description="Your employment and work contact information.">
          <Row label="Employment status" value={professional.employmentStatus} />
          <Row label="Employer" value={professional.employerName} />
          <Row label="Job title" value={professional.jobTitle} />
          <Row label="Work email" value={professional.workEmail} />
          <Row label="Work phone" value={professional.workPhone} />
          <Row label="Work address" value={workAddress} />
        </DetailSection>

        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <h3 className="px-4 pt-4 text-sm font-semibold">Account activity</h3>
          <dl className="mt-2">
            <Row label="Last sign-in" value={meta.lastLoginAt ? formatDateTime(meta.lastLoginAt) : ""} />
            <Row label="Customer since" value={formatDate(meta.createdAt)} />
          </dl>
        </section>

        <section className="rounded-2xl bg-brand/5 px-4 py-3 ring-1 ring-brand/15">
          <h3 className="text-sm font-semibold text-charcoal">Settings</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">Limits, language, colour theme, and display preferences.</p>
        </section>

        <ProfileSettingsSection
          embedded
          limits={limits}
          hideBalances={meta.hideBalances}
          notifyTransactions={meta.notifyTransactions}
          notifyStatements={meta.notifyStatements}
        />

        <Button type="button" variant="danger" className="w-full" onClick={logout}>
          Log off
        </Button>
      </div>
    </div>
  );
}
