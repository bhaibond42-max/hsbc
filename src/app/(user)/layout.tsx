import { prisma } from "@/lib/db";
import { BalancePrivacyProvider } from "@/components/balance-privacy-provider";
import { LoginLocationFlush } from "@/components/login-location-flush";
import { requireUserPage } from "@/server/auth";
import { UserShell } from "@/components/shells";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUserPage();
  const unread = await prisma.notification.count({ where: { userId: session.user.id, read: false } });
  return (
    <BalancePrivacyProvider
      initialHidden={session.user.hideBalances}
      notifyTransactions={session.user.notifyTransactions}
      notifyStatements={session.user.notifyStatements}
    >
      <UserShell name={session.user.fullName} unread={unread}>
        <LoginLocationFlush />
        {children}
      </UserShell>
    </BalancePrivacyProvider>
  );
}
