import Link from "next/link";
import { AuthScreen, ForgotForm } from "@/components/auth-forms";

export default function ForgotPage() {
  return (
    <AuthScreen title="Reset your password" subtitle="We'll prepare a reset link for your HSBC UK account." footer={<Link href="/login">Back to log on</Link>}>
      <ForgotForm portal="USER" />
    </AuthScreen>
  );
}
