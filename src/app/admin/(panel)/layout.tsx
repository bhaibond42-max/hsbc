import { requireAdminPage } from "@/server/auth";
import { AdminShell } from "@/components/shells";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return <AdminShell name={session.user.fullName}>{children}</AdminShell>;
}
