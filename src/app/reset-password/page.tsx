import Link from "next/link";
import { AuthScreen, ResetForm } from "@/components/auth-forms";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthScreen title="Choose a new password" subtitle="This link expires after 30 minutes." footer={<Link href="/login">Back to log on</Link>}>
      {token ? <ResetForm token={token} portal="USER" /> : <p className="text-sm text-red-700">This reset link is incomplete.</p>}
    </AuthScreen>
  );
}
