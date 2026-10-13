export function exploreHeroForSlug(slug: string): string | undefined {
  if (["upi", "fund-transfer", "bill-pay", "direct-debit", "receive", "standing-order", "international", "request-money"].includes(slug)) {
    return "/ui/hero-payments.svg";
  }
  if (["stocks", "funds", "isa", "bonds", "portfolio", "watchlist"].includes(slug)) {
    return "/ui/hero-investments.svg";
  }
  if (["personal-loan", "home-loan", "car-loan", "overdraft", "repayments", "loan-calculator"].includes(slug)) {
    return "/ui/hero-loans.svg";
  }
  if (["savings", "fixed-deposit", "notice-account", "cash-isa", "premier-saver", "deposit-rates"].includes(slug)) {
    return "/ui/hero-deposits.svg";
  }
  if (["debit-card", "card-controls", "card-limits", "card-pin", "card-statements", "card-offers"].includes(slug)) {
    return "/ui/hero-cards.svg";
  }
  if (["statements", "documents", "cheque-book", "branches", "alerts", "help", "goals", "insights"].includes(slug)) {
    return "/ui/hero-services.svg";
  }
  return undefined;
}

export const depositRatesTable = [
  { product: "Online Bonus Saver", category: "Variable", rate: "3.20% AER", min: "£1", term: "Instant access" },
  { product: "Fixed Rate Saver 1yr", category: "Fixed", rate: "4.10% AER", min: "£1,000", term: "12 months" },
  { product: "Fixed Rate Saver 2yr", category: "Fixed", rate: "3.90% AER", min: "£1,000", term: "24 months" },
  { product: "95 Day Notice", category: "Notice", rate: "3.75% AER", min: "£1", term: "95 days notice" },
  { product: "Cash ISA", category: "ISA", rate: "3.55% AER", min: "£1", term: "Instant access" },
  { product: "Premier Saver", category: "Premier", rate: "2.00% AER", min: "£1", term: "Up to £50,000 band" },
] as const;

export const demoBranches = [
  {
    name: "HSBC UK — Birmingham New Street",
    address: "38 New Street, Birmingham B2 4BQ",
    hours: "Mon–Fri 9:30–16:30 · Sat closed",
  },
  {
    name: "HSBC UK — Manchester St Ann's",
    address: "68 St Ann's Square, Manchester M2 7LR",
    hours: "Mon–Fri 9:30–16:30 · Sat 9:30–12:30",
  },
  {
    name: "HSBC UK — London Canary Wharf",
    address: "8 Canada Square, London E14 5HQ",
    hours: "Mon–Fri 9:00–17:00 · Sat closed",
  },
] as const;

export const billPayCategories = [
  { id: "electricity", label: "Electricity", hint: "Link via direct debit" },
  { id: "water", label: "Water", hint: "Regional suppliers" },
  { id: "broadband", label: "Broadband", hint: "Monthly plans" },
  { id: "mobile", label: "Mobile", hint: "Contract or pay monthly" },
  { id: "council", label: "Council tax", hint: "10-month schedule" },
  { id: "other", label: "Other", hint: "Insurance, subscriptions" },
] as const;
