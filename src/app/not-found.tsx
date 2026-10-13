import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center px-6">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-semibold">That page is not available</h1>
      <Link href="/" className="mt-6 text-sm font-semibold text-brand">
        Back to the start
      </Link>
    </main>
  );
}
