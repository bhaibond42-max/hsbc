import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/server/auth";
import { UserShell } from "@/components/shells";
import { HsbcLogo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function HelpLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.user.role === "USER" && session.portal === "USER") {
    const unread = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
    return (
      <UserShell name={session.user.fullName} unread={unread}>
        {children}
      </UserShell>
    );
  }

  return (
    <div className="min-h-dvh bg-mist">
      <header className="border-b border-line bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/login" className="shrink-0">
            <HsbcLogo size={56} />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-brand hover:underline">
            Log on
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
