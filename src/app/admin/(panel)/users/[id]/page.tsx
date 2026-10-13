import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { fromPence, toPence } from "@/lib/money";
import { requireAdminPage } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { serializeAccount, serializeTxn, serializeUser } from "@/server/serialize";
import { AdminCustomer } from "@/components/admin-customer";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "USER") notFound();
  const accounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const txns = await queryTransactions({ userId: user.id, page: 1, pageSize: 100 });
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const actions = await prisma.adminAction.findMany({
    where: { targetUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { admin: { select: { fullName: true } } },
  });
  const balance = fromPence(accounts.reduce((sum, account) => sum + toPence(account.currentBalance.toString()), 0n));
  const view = serializeUser(user, { balance, accounts: accounts.length });
  return (
    <div className="space-y-4">
      <AdminCustomer
        user={{
          ...view,
          dateOfBirth: user.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          addressLine: user.addressLine,
          city: user.city,
          postcode: user.postcode,
          occupation: user.occupation,
          nationality: user.nationality,
          maritalStatus: user.maritalStatus,
          employerName: user.employerName,
          jobTitle: user.jobTitle,
          workEmail: user.workEmail,
          workPhone: user.workPhone,
          workAddressLine: user.workAddressLine,
          workCity: user.workCity,
          workPostcode: user.workPostcode,
          employmentStatus: user.employmentStatus,
          onlinePaymentLimit: user.onlinePaymentLimit.toString(),
          hasLoginPin: Boolean(user.loginPinHash),
        }}
        accounts={accounts.map((account) => {
          const item = serializeAccount(account, true);
          return {
            id: item.id,
            name: item.name,
            currentBalance: item.currentBalance,
            status: item.status,
            accountNumber: account.accountNumber,
            dailyLimit: item.dailyLimit,
            cardLast4: account.cardLast4,
          };
        })}
        notifications={notifications.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          type: item.type,
          read: item.read,
          createdAt: item.createdAt.toISOString(),
        }))}
        transactions={txns.items.map((txn) => {
          const item = serializeTxn(txn);
          return {
            id: item.id,
            accountId: item.accountId,
            description: item.description,
            amount: item.amount,
            type: item.type,
            status: item.status,
            reference: item.reference,
            category: item.category,
            merchant: item.merchant,
            transactionDate: item.transactionDate,
          };
        })}
      />
      <section className="rounded-2xl bg-white ring-1 ring-line">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Staff activity</h2>
        {actions.length === 0 ? <p className="px-4 py-4 text-sm text-neutral-500">No staff actions for this customer yet.</p> : null}
        {actions.map((action) => (
          <p key={action.id} className="border-b border-line px-4 py-3 text-sm last:border-b-0">
            {action.summary}
            <span className="mt-1 block text-xs text-neutral-500">{action.admin.fullName} · {formatDateTime(action.createdAt)}</span>
          </p>
        ))}
      </section>
    </div>
  );
}
