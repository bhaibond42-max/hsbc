import { prisma } from "@/lib/db";
import { buildCustomerProfileView } from "@/lib/customer-profile";
import { requireUserPage } from "@/server/auth";
import { ProfileScreen } from "@/components/profile-screen";

export default async function ProfilePage() {
  const session = await requireUserPage();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const accounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const primary = accounts.find((a) => a.accountType === "SAVINGS") ?? accounts[0];
  const profile = buildCustomerProfileView(user);

  return (
    <ProfileScreen
      meta={{
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        hideBalances: user.hideBalances,
        notifyTransactions: user.notifyTransactions,
        notifyStatements: user.notifyStatements,
      }}
      profile={profile}
      limits={{
        accountName: primary?.name ?? "Savings Account",
        dailyCardLimit: primary?.dailyLimit.toString() ?? "500.00",
        onlinePaymentLimit: user.onlinePaymentLimit.toString(),
      }}
    />
  );
}
