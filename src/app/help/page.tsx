import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { BankingPageIntro } from "@/components/page-intro";
import { Card, PageHeader, SectionHeader } from "@/components/ui";
import { getSession } from "@/server/auth";

const faqs = [
  {
    title: "Getting started",
    paragraphs: [
      "After you log on, the home screen shows a greeting, your primary balance card, quick actions, and a preview of recent activity. Use the menu on desktop or the bottom navigation on mobile to reach Accounts, Payments, Transactions, and more.",
      "If this is your first visit, open Accounts to confirm which accounts are linked to your profile, then try a transfer between your own accounts under Payments to see how confirmation and receipts work.",
      "Additional services are available from the home grid — each tile opens a dedicated screen for payments, cards, savings, and other HSBC UK services.",
    ],
  },
  {
    title: "Log on and security",
    paragraphs: [
      "Use your registered email address and password on the log on screen. Staff who manage customer accounts use separate credentials and are directed to the staff console after a successful log on.",
      "If you choose “Remember me”, your session may stay signed in on this device for longer. Always log off on shared or public devices. A secure session cookie is used; you may see a “Secure session” indicator in the header while you are signed in.",
      "After several failed log on attempts, access is paused for a short period to protect your account. Never share your password or 4-digit balance PIN with anyone, including people who claim to be from the bank.",
      "We will never ask you to move money to a “safe account” or to install remote-access software. If you are unsure about a message or call, stop and contact HSBC UK through hsbc.co.uk.",
    ],
  },
  {
    title: "Balances and the 4-digit password",
    paragraphs: [
      "Your available balance is shown on the home screen and on each account. If you turn on “Hide balances”, amounts are masked until you enter your 4-digit password.",
      "The eye control on the primary account card hides or reveals balances. Changing this preference in Settings may also require your 4-digit password when revealing amounts again.",
      "Pending items, when shown, may not yet be included in your available balance. Clearing times depend on the payment type and the receiving bank.",
    ],
  },
  {
    title: "Accounts and cards",
    paragraphs: [
      "The Accounts area lists your accounts and the latest activity line. Full account numbers are not shown in this app. Open an account to see more detail, controls, and recent entries.",
      "Debit cards linked to an account can be managed under Cards. You can freeze or unfreeze a card, adjust daily limits where supported, and toggle contactless, online, and ATM usage.",
      "Card numbers are always masked in the app. Never share your full card number, PIN, or online banking password with anyone who contacts you unexpectedly.",
      "Opening new products is subject to eligibility, credit checks, and the terms that apply to each HSBC UK product.",
    ],
  },
  {
    title: "Payments and transfers",
    paragraphs: [
      "Under Payments you can move money between your HSBC UK accounts. Choose the source and destination account, enter the amount and an optional reference, review the details, then confirm.",
      "Use Receive for guidance on getting paid into your account. Sort codes and account numbers are not displayed or copyable in this app — contact HSBC UK if you need to share receiving details. Incoming credits appear in your transaction list when funds are credited.",
      "The Saved payees tab lists people or businesses you have stored for faster payments. Some account types may restrict payments to external bank accounts in line with product rules.",
      "Standing orders and scheduled payments can be created from Explore or Payments-related flows where available.",
    ],
  },
  {
    title: "Transactions and statements",
    paragraphs: [
      "Transactions are grouped by day with sticky date headings. Use search and filters to narrow by direction, status, account, category, or date range. Select a row to open transaction detail including reference and status.",
      "Completed payments usually appear immediately. Some transfers can take longer depending on the payment scheme and the receiving bank.",
      "Statements let you choose an account and date range, then download a CSV file of entries for your records.",
      "If you cannot find a payment, check that the correct account filter is selected and that the date range includes the day you made the transfer.",
    ],
  },
  {
    title: "Explore and extra services",
    paragraphs: [
      "The home services grid links to features such as request money, bill payments, loan calculators, investments, and cheque book requests.",
      "Rates and product information are published for information and may change. Investment and loan tools provide estimates only and are not personal advice.",
    ],
  },
  {
    title: "Profile, settings, and notifications",
    paragraphs: [
      "Profile shows your personal and professional details held by the bank. To update your records, contact HSBC UK or your relationship manager.",
      "Settings holds preferences such as limits, language, colour theme, and display options.",
      "The bell icon shows notifications about account activity, such as transfers or balance changes. Open Notifications to mark items as read.",
    ],
  },
  {
    title: "Mobile app",
    paragraphs: [
      "The HSBC UK mobile app loads secure online banking in a WebView. Log on once inside the app; session behaviour matches the browser.",
      "For the best experience, use the same log on credentials you use on desktop and keep your device software up to date.",
    ],
  },
];

const termsSections: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. About HSBC UK online banking",
    paragraphs: [
      "These terms apply to your use of HSBC UK online banking and the related mobile experience. By logging on, you agree to these terms and to the product-specific terms for any accounts or services you hold with us.",
      "HSBC Bank plc is registered in England and Wales. Our registered office is at 8 Canada Square, London E14 5HQ. We are authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority and the Prudential Regulation Authority.",
    ],
  },
  {
    heading: "2. Eligibility and acceptable use",
    paragraphs: [
      "You must be at least 18 years old and authorised to use the accounts shown in your profile. You must keep your log on details confidential and tell us promptly if you think someone else knows them.",
      "You must not use the service for unlawful purposes, to send false or misleading payment instructions, or to interfere with the security or operation of the platform.",
      "We may suspend or restrict access if we reasonably believe your account is at risk or these terms have been breached.",
    ],
  },
  {
    heading: "3. Accounts, payments, and information",
    paragraphs: [
      "Balances, transaction history, and statements are shown in good faith based on our records at the time you view them. Interest rates, fees, and product names are subject to change and to the agreements for each product.",
      "Payment and transfer services are subject to cut-off times, limits, and scheme rules. We are not responsible for delays caused by other banks or payment networks outside our control.",
      "Tools such as calculators and rate displays provide general information only. They do not constitute an offer, invitation, or personal recommendation.",
    ],
  },
  {
    heading: "4. Security and privacy",
    paragraphs: [
      "You are responsible for keeping your password, PIN, and device secure. We use industry-standard measures to protect your session and data in transit and at rest.",
      "We process personal data in line with our privacy notice and applicable data protection law. You can find more about how we use your information on hsbc.co.uk.",
      "Never respond to unsolicited requests for your full card number, PIN, or log on details. Report suspicious activity through the channels provided in the app or on hsbc.co.uk.",
    ],
  },
  {
    heading: "5. Availability and changes",
    paragraphs: [
      "We aim to keep online banking available at all times but may need to carry out maintenance or experience interruptions. We will try to give notice of planned downtime where practical.",
      "We may update features, limits, or these terms from time to time. Material changes will be communicated in line with our usual customer notification practices.",
    ],
  },
  {
    heading: "6. Liability",
    paragraphs: [
      "We are not liable for losses caused by circumstances outside our reasonable control, or where you have not kept your credentials secure or have failed to tell us about unauthorised access without undue delay.",
      "Nothing in these terms excludes or limits liability where it would be unlawful to do so, including for death or personal injury caused by our negligence or for fraud.",
    ],
  },
  {
    heading: "7. Intellectual property",
    paragraphs: [
      "The software, design, and content of this service are protected by intellectual property laws. HSBC and the hexagon symbol are trademarks of HSBC Group members.",
      "You may use the service only for your personal or business banking with us. You must not copy, scrape, or redistribute the application or its content without our written consent.",
    ],
  },
  {
    heading: "8. Third-party services",
    paragraphs: [
      "Some features may rely on trusted third-party providers for hosting, identity, or payment processing. Those providers are required to meet our security and privacy standards.",
      "Links to external websites are provided for convenience. We are not responsible for the content or policies of sites we do not control.",
    ],
  },
  {
    heading: "9. Changes to these terms",
    paragraphs: [
      "We may revise these terms when we update the service or when the law requires. The current version is always published on this page.",
      "Continued use of online banking after changes take effect means you accept the updated terms, unless the law requires your separate agreement.",
    ],
  },
  {
    heading: "10. Governing law",
    paragraphs: [
      "These terms are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction, subject to any rights you may have under consumer protection rules in your place of residence.",
    ],
  },
];

const quickLinks = [
  { href: "#faq", label: "FAQs" },
  { href: "#terms-and-conditions", label: "Terms and conditions" },
];

export default async function HelpPage() {
  const session = await getSession();
  const signedInUser = session?.user.role === "USER" && session.portal === "USER";
  const back = signedInUser ? "/home" : "/login";

  return (
    <div className="md:pt-2">
      <PageHeader title="Help" back={back} />
      <div className="space-y-8 px-4 pb-12 md:px-0">
        <BankingPageIntro
          title="Help and support"
          description="Guidance for HSBC UK online banking: log on, accounts, payments, statements, security, and terms."
          icon={CircleHelp}
        />

        <Card padding="md">
          <p className="text-sm leading-relaxed text-muted">
            This help centre explains how to use online banking, what to expect from accounts and payments, and how we keep
            your service secure. Use the links below for frequently asked questions or the full terms and conditions. Logging
            on means you agree to those terms together with your account agreements.
          </p>
          <nav className="mt-4 flex flex-wrap gap-3" aria-label="Help sections">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-mist"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>

        <section id="faq">
          <SectionHeader title="Frequently asked questions" description="Answers for common tasks in online banking." />
          <div className="mt-4 space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.title} padding="md">
                <h2 className="text-base font-semibold text-charcoal">{faq.title}</h2>
                <div className="mt-3 space-y-3">
                  {faq.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="terms-and-conditions">
          <SectionHeader title="Terms and conditions" description="Your agreement for using HSBC UK online banking." />
          <Card padding="md" className="space-y-6">
            <p className="text-sm leading-relaxed text-muted">
              Please read these terms carefully before using online banking. By logging on and using the services, you agree
              to the following conditions in addition to the terms that apply to each of your HSBC UK products.
            </p>
            {termsSections.map((block) => (
              <article key={block.heading}>
                <h3 className="text-sm font-semibold text-charcoal">{block.heading}</h3>
                <div className="mt-2 space-y-2">
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
            <p className="border-t border-line pt-4 text-xs text-muted">© HSBC UK.</p>
          </Card>
        </section>
      </div>
    </div>
  );
}
