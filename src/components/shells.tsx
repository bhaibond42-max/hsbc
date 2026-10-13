"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  CircleHelp,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Radar,
  PieChart,
  PiggyBank,
  Repeat,
  ScrollText,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/client";
import { formatTodayLong } from "@/lib/format";
import { HsbcLogo } from "./logo";
import { BalancePrivacyToggle } from "./balance-privacy-provider";
import { NoCopy } from "./no-copy";
import { ForceLoginOnReload } from "./force-login-on-reload";
import { SecureSessionBadge } from "./ui";

const userLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/payments", label: "Payments", icon: ArrowLeftRight },
  { href: "/transactions", label: "Transactions", icon: ScrollText },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const desktopExtra = [
  { href: "/insights", label: "Insights", icon: PieChart },
  { href: "/direct-debits", label: "Direct debits", icon: Repeat },
  { href: "/goals", label: "Goals", icon: PiggyBank },
  { href: "/statements", label: "Statements", icon: FileText },
  { href: "/help", label: "Help", icon: CircleHelp },
  { href: "/settings", label: "Settings", icon: Settings },
];

function active(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ large = false, onDark = false }: { large?: boolean; onDark?: boolean }) {
  return <HsbcLogo onDark={onDark} size={large ? 112 : 80} />;
}

export function UserShell({
  name,
  unread,
  children,
}: {
  name: string;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-mist text-ink">
      <ForceLoginOnReload />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface md:flex">
        <div className="border-b-4 border-brand px-5 py-5">
          <Wordmark />
        </div>
        <p className="truncate px-5 pt-4 text-xs font-medium uppercase tracking-wide text-muted">Signed in as</p>
        <p className="truncate px-5 text-sm font-semibold text-charcoal">{name}</p>
        <nav className="mt-5 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
          {[...userLinks, ...desktopExtra].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active(pathname, item.href)
                  ? "bg-brand-soft text-brand"
                  : "text-charcoal hover:bg-mist",
              )}
            >
              <item.icon size={18} strokeWidth={active(pathname, item.href) ? 2.25 : 2} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-4">
          <button
            type="button"
            onClick={logout}
            className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-mist"
          >
            <LogOut size={18} />
            Log off
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-line bg-surface/95 px-6 py-3 backdrop-blur md:flex">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <label className="relative max-w-md flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <span className="sr-only">Search banking</span>
              <input
                readOnly
                onFocus={() => router.push("/transactions")}
                placeholder="Search transactions…"
                className="focus-ring h-10 w-full cursor-pointer rounded-md border border-line bg-mist pl-9 pr-3 text-sm text-charcoal placeholder:text-muted"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <BalancePrivacyToggle className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-charcoal hover:bg-mist disabled:opacity-50" />
            <SecureSessionBadge />
            <Link
              href="/notifications"
              className="focus-ring relative grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-charcoal hover:bg-mist"
              aria-label={unread ? `${unread} unread notifications` : "Notifications"}
            >
              <Bell size={18} />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
              ) : null}
            </Link>
          </div>
        </header>

        <NoCopy>
          <div className="mx-auto min-h-dvh w-full max-w-4xl pb-24 md:pb-10 md:px-6 md:pt-2">{children}</div>
        </NoCopy>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/98 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {userLinks.map((item) => {
            const on = active(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                    on ? "text-brand" : "text-muted",
                  )}
                >
                  <item.icon size={20} strokeWidth={on ? 2.25 : 2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <BalancePrivacyToggle className="focus-ring fixed right-16 top-4 z-40 grid h-10 w-10 place-items-center rounded-md border border-line bg-surface shadow-sm md:hidden disabled:opacity-50" />
      <Link
        href="/notifications"
        className="focus-ring fixed right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-md border border-line bg-surface shadow-sm md:hidden"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />
        ) : null}
      </Link>
    </div>
  );
}

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/monitor", label: "Log on monitor", icon: Radar },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="min-h-dvh bg-mist text-ink md:flex">
      <ForceLoginOnReload />
      <aside className="flex flex-col border-b border-line bg-charcoal text-white md:fixed md:inset-y-0 md:w-64 md:border-b-0">
        <div className="border-b border-white/10 px-5 py-5 md:border-b-0">
          <Wordmark onDark />
          <p className="mt-3 hidden text-xs text-neutral-400 md:block">Staff banking console</p>
          <p className="mt-1 hidden truncate text-sm font-medium text-white md:block">{name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-x-auto px-3 py-3 md:mt-2 md:overflow-visible md:px-3 md:pb-4">
          {adminLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "focus-ring flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active(pathname, item.href) ? "bg-white text-charcoal" : "text-neutral-300 hover:bg-white/10",
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={logout}
            className="focus-ring flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/10 md:mt-auto"
          >
            <LogOut size={17} />
            Log off
          </button>
        </nav>
      </aside>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:ml-64 md:px-8">
        <div className="mb-6 hidden items-center justify-between md:flex">
          <p className="text-sm text-muted">{formatTodayLong()}</p>
          <SecureSessionBadge />
        </div>
        {children}
      </div>
    </div>
  );
}
