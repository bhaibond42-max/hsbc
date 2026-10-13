import Link from "next/link";
import { redirect } from "next/navigation";
import { PinEntryForm } from "@/components/pin-entry-form";
import { HsbcLogo } from "@/components/logo";
import { getSession } from "@/server/auth";
import { greetingFirstName, resolveLoginPinChallenge } from "@/server/login-pin";

export const dynamic = "force-dynamic";

export default async function LoginPinPage() {
  const session = await getSession();
  if (session?.user.role === "USER" && session.portal === "USER") {
    redirect("/home");
  }

  let greetingName = "there";
  try {
    const challenge = await resolveLoginPinChallenge();
    greetingName = greetingFirstName(challenge.user.fullName);
  } catch {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh bg-white">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-8">
        <HsbcLogo size={56} />
        <p className="hidden text-xs font-medium text-muted sm:block">HSBC UK online banking</p>
      </header>
      <div className="mx-auto w-full max-w-lg px-6 py-12 sm:py-16">
        <PinEntryForm greetingName={greetingName} />
        <p className="mt-12 text-sm text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to log on
          </Link>
        </p>
      </div>
    </main>
  );
}
