import type { User } from "@prisma/client";

/** Sample values shown when profile fields are not set in the database yet. */
export const PROFILE_SAMPLE_DEFAULTS = {
  dateOfBirth: "1990-05-15",
  addressLine: "42 Maple Street",
  city: "Birmingham",
  postcode: "B15 2TT",
  occupation: "Software engineer",
  nationality: "British",
  maritalStatus: "Married",
  employerName: "Midland Tech Solutions Ltd",
  jobTitle: "Senior Analyst",
  workEmail: "name@employer.example",
  workPhone: "+44 121 496 0123",
  workAddressLine: "5 Brindleyplace",
  workCity: "Birmingham",
  workPostcode: "B1 2HL",
  employmentStatus: "Employed full-time",
} as const;

export type CustomerProfileView = {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    addressLine: string;
    city: string;
    postcode: string;
    occupation: string;
    nationality: string;
    maritalStatus: string;
  };
  professional: {
    employerName: string;
    jobTitle: string;
    workEmail: string;
    workPhone: string;
    workAddressLine: string;
    workCity: string;
    workPostcode: string;
    employmentStatus: string;
  };
};

type ProfileSource = Pick<
  User,
  | "fullName"
  | "email"
  | "phone"
  | "dateOfBirth"
  | "addressLine"
  | "city"
  | "postcode"
  | "occupation"
  | "nationality"
  | "maritalStatus"
  | "employerName"
  | "jobTitle"
  | "workEmail"
  | "workPhone"
  | "workAddressLine"
  | "workCity"
  | "workPostcode"
  | "employmentStatus"
>;

function pick(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatDob(value: Date | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.toISOString().slice(0, 10);
}

/** Customer profile for display (fills sample data where the database is empty). */
export function buildCustomerProfileView(user: ProfileSource, options?: { useSampleDefaults?: boolean }): CustomerProfileView {
  const sample = options?.useSampleDefaults !== false;
  const d = sample ? PROFILE_SAMPLE_DEFAULTS : null;

  return {
    personal: {
      fullName: user.fullName,
      email: user.email,
      phone: pick(user.phone, sample ? "+44 7700 900123" : ""),
      dateOfBirth: formatDob(user.dateOfBirth, d?.dateOfBirth ?? ""),
      addressLine: pick(user.addressLine, d?.addressLine ?? ""),
      city: pick(user.city, d?.city ?? ""),
      postcode: pick(user.postcode, d?.postcode ?? ""),
      occupation: pick(user.occupation, d?.occupation ?? ""),
      nationality: pick(user.nationality, d?.nationality ?? ""),
      maritalStatus: pick(user.maritalStatus, d?.maritalStatus ?? ""),
    },
    professional: {
      employerName: pick(user.employerName, d?.employerName ?? ""),
      jobTitle: pick(user.jobTitle, d?.jobTitle ?? ""),
      workEmail: pick(user.workEmail, d?.workEmail ?? ""),
      workPhone: pick(user.workPhone, d?.workPhone ?? ""),
      workAddressLine: pick(user.workAddressLine, d?.workAddressLine ?? ""),
      workCity: pick(user.workCity, d?.workCity ?? ""),
      workPostcode: pick(user.workPostcode, d?.workPostcode ?? ""),
      employmentStatus: pick(user.employmentStatus, d?.employmentStatus ?? ""),
    },
  };
}
