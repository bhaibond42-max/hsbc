import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const USER_PREFIXES = [
  "/home",
  "/accounts",
  "/payments",
  "/transactions",
  "/statements",
  "/notifications",
  "/profile",
  "/cards",
  "/settings",
  "/insights",
  "/direct-debits",
  "/goals",
  "/rates",
  "/explore",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const needsUser = USER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const openAdmin = pathname === "/admin/login" || pathname === "/admin/forgot-password" || pathname.startsWith("/admin/reset-password");
  const needsAdmin = pathname.startsWith("/admin") && !openAdmin;
  if ((needsUser || needsAdmin) && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
