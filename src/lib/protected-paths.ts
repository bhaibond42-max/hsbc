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
  "/help",
];

const OPEN_ADMIN = ["/admin/login", "/admin/forgot-password"];

export function isProtectedAppPath(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0] ?? pathname;
  const openAdmin =
    OPEN_ADMIN.includes(path) || path.startsWith("/admin/reset-password");
  if (path.startsWith("/admin") && !openAdmin) return true;
  return USER_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
