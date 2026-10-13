import { forbidden } from "@/lib/http";

/** Customer portal: view accounts, activity, and documents only (no self-service changes). */
export const USER_PORTAL_VIEW_ONLY = true;

export const USER_VIEW_ONLY_MESSAGE =
  "Your online banking is view-only. Contact HSBC UK to make payments, orders, or profile changes.";

export function assertUserCanMutate() {
  if (USER_PORTAL_VIEW_ONLY) throw forbidden(USER_VIEW_ONLY_MESSAGE);
}
