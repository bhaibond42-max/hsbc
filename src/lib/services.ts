export type ServiceFact = { label: string; value: string };

export type ServiceItem = {
  slug: string;
  label: string;
  href: string;
  icon: string;
  summary: string;
  facts: ServiceFact[];
  action?: { href: string; label: string };
  calculator?: boolean;
};

export type ServiceSection = {
  title: string;
  items: ServiceItem[];
};

function item(
  slug: string,
  label: string,
  icon: string,
  summary: string,
  facts: ServiceFact[],
  href = `/explore/${slug}`,
  action?: { href: string; label: string },
  calculator = false,
): ServiceItem {
  return { slug, label, href, icon, summary, facts, action, calculator };
}

export const serviceSections: ServiceSection[] = [
  {
    title: "Payments and transfers",
    items: [
      item(
        "upi",
        "UPI",
        "qr",
        "No UPI ID is set up.",
        [{ label: "Status", value: "None" }],
      ),
      item(
        "fund-transfer",
        "Fund transfer",
        "transfer",
        "Move money between your own HSBC UK savings accounts.",
        [{ label: "Type", value: "Between your accounts" }],
        "/payments?mode=transfer",
        { href: "/payments?mode=transfer", label: "Start transfer" },
      ),
      item("bill-pay", "Bill pay", "receipt", "Pay household bills from the direct debits already set up.", [], "/direct-debits"),
      item("direct-debit", "Direct debit", "repeat", "Direct debits you set up will be listed here.", [], "/direct-debits"),
      item("receive", "Receive", "wallet", "Share your sort code and account number to receive money.", [], "/payments?mode=receive"),
      item(
        "standing-order",
        "Standing order",
        "calendar",
        "A regular payment you control, sent on the same date each month.",
        [
          { label: "Next date", value: "1st of the month" },
          { label: "Typical use", value: "Rent, family support" },
          { label: "From", value: "Savings account" },
          { label: "Status", value: "None set up" },
        ],
      ),
      item(
        "international",
        "International",
        "globe",
        "Send pounds abroad or check an indicative exchange rate.",
        [
          { label: "Currencies", value: "EUR, USD, AED, INR" },
          { label: "Cut-off", value: "15:00 UK time" },
          { label: "Fee", value: "£0 in branch rates view" },
        ],
        "/explore/international",
        { href: "/rates", label: "View rates" },
      ),
      item(
        "request-money",
        "Request money",
        "hand",
        "Ask someone to pay you by sharing your account details.",
        [{ label: "Requests", value: "None" }],
        "/explore/request-money",
        { href: "/payments?mode=receive", label: "Share details" },
      ),
    ],
  },
  {
    title: "Investments",
    items: [
      item("stocks", "Stocks & shares", "chart", "No share holdings yet.", [{ label: "Holdings", value: "None" }]),
      item("funds", "Funds", "pie", "No funds yet.", [{ label: "Funds", value: "None" }]),
      item("isa", "Stocks ISA", "shield", "No stocks and shares ISA is open.", [{ label: "ISA", value: "None" }]),
      item("bonds", "Bonds", "landmark", "No bonds are held.", [{ label: "Bonds", value: "None" }]),
      item("portfolio", "Portfolio", "briefcase", "Nothing is held yet.", [{ label: "Total", value: "£0.00" }]),
      item("watchlist", "Watchlist", "eye", "No prices are being followed.", [{ label: "Watchlist", value: "Empty" }]),
    ],
  },
  {
    title: "Loans",
    items: [
      item("personal-loan", "Personal loan", "banknote", "No personal loan is open.", [{ label: "Loans", value: "None" }]),
      item("home-loan", "Home loan", "house", "No home loan is open.", [{ label: "Loans", value: "None" }]),
      item("car-loan", "Car loan", "car", "No car loan is open.", [{ label: "Loans", value: "None" }]),
      item("overdraft", "Overdraft", "minus", "No overdraft is arranged.", [{ label: "Used", value: "£0.00" }]),
      item("repayments", "Repayments", "calendar", "Nothing is due. A new loan would appear here.", [
        { label: "Due this month", value: "£0.00" },
        { label: "Next date", value: "—" },
        { label: "Loans", value: "None open" },
      ]),
      item(
        "loan-calculator",
        "Calculator",
        "calculator",
        "Estimate a monthly repayment. This is an illustration, not an offer.",
        [
          { label: "Rate used", value: "6.9% APR" },
          { label: "Term", value: "36 months" },
        ],
        "/explore/loan-calculator",
        undefined,
        true,
      ),
    ],
  },
  {
    title: "Deposits",
    items: [
      item("savings", "Savings", "piggy", "Your everyday savings balance and recent entries.", [], "/accounts"),
      item("fixed-deposit", "Fixed deposit", "lock", "Lock money away for a set term at a fixed rate.", [
        { label: "1 year", value: "4.10% AER" },
        { label: "2 years", value: "3.90% AER" },
        { label: "Minimum", value: "£1,000" },
      ]),
      item("notice-account", "Notice account", "clock", "Give notice before you withdraw, for a higher rate.", [
        { label: "Notice", value: "95 days" },
        { label: "Rate", value: "3.75% AER" },
        { label: "Minimum", value: "£1" },
      ]),
      item("cash-isa", "Cash ISA", "shield", "Tax-free cash savings within the annual ISA allowance.", [
        { label: "Rate", value: "3.55% AER" },
        { label: "Allowance left", value: "£20,000" },
        { label: "Access", value: "Instant" },
      ]),
      item("premier-saver", "Premier saver", "star", "A variable saver for balances held with HSBC UK.", [
        { label: "Rate", value: "2.00% AER" },
        { label: "Balance band", value: "Up to £50,000" },
        { label: "Withdrawals", value: "Unlimited" },
      ]),
      item("deposit-rates", "Interest rates", "percent", "Compare saver rates and currency rates.", [], "/rates"),
    ],
  },
  {
    title: "Cards",
    items: [
      item("debit-card", "Debit card", "card", "Your debit card artwork, freeze switch, and status.", [], "/cards"),
      item("card-controls", "Card controls", "sliders", "Contactless, online payments and cash withdrawals.", [], "/cards"),
      item("card-limits", "Limits", "gauge", "Daily spending limit on the debit card.", [
        { label: "Daily limit", value: "£500" },
        { label: "Contactless", value: "On" },
        { label: "Online", value: "On" },
        { label: "ATM", value: "On" },
      ], "/explore/card-limits", { href: "/cards", label: "Manage card" }),
      item("card-pin", "PIN", "key", "View how to reveal or change the card PIN.", [
        { label: "Card", value: "Debit · ••••" },
        { label: "PIN tries left", value: "3" },
        { label: "Last change", value: "Not in this app" },
      ]),
      item("card-statements", "Statements", "file", "Download a statement for a date range.", [], "/statements"),
      item("card-offers", "Offers", "tag", "No card offers are available.", [{ label: "Offers", value: "None" }]),
    ],
  },
  {
    title: "Services",
    items: [
      item("statements", "Statements", "file", "Pick dates and download your entries.", [], "/statements"),
      item("documents", "Documents", "folder", "No documents are stored.", [{ label: "Documents", value: "None" }]),
      item("cheque-book", "Cheque book", "book", "Order a cheque book for the savings account.", [
        { label: "Last order", value: "None" },
        { label: "Delivery", value: "5 working days" },
        { label: "Fee", value: "£0" },
      ]),
      item("branches", "Branches", "building", "No branches are listed.", [{ label: "Branches", value: "None" }]),
      item("alerts", "Alerts", "bell", "Transaction and statement notifications.", [], "/notifications"),
      item("help", "Help", "help", "Log on, balances, payments and card controls.", [], "/help"),
      item("goals", "Goals", "target", "Savings goals you create will show here.", [], "/goals"),
      item("insights", "Insights", "pie", "Where money went this month.", [], "/insights"),
    ],
  },
];

export function findService(slug: string) {
  for (const section of serviceSections) {
    const found = section.items.find((entry) => entry.slug === slug);
    if (found) return found;
  }
  return null;
}
