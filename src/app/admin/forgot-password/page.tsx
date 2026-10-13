import Link from "next/link";
import { AuthScreen, ForgotForm } from "@/components/auth-forms";

export default function AdminForgotPage() {
  return (
    <AuthScreen title="Reset staff password" subtitle="Reset for HSBC UK staff accounts." footer={<Link href="/login">Back to log on</Link>}>
      <ForgotForm portal="ADMIN" />
    </AuthScreen>
  );
}
