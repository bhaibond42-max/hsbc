"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import {
  getDocumentLoadPath,
  setDocumentLoadPath,
  shouldRunForceLoginOnReload,
  skipNextLoginSplash,
} from "@/lib/document-load-path";
import { isEmbeddedBankApp } from "@/lib/embedded-app";
import { isProtectedAppPath } from "@/lib/protected-paths";
import { OpeningSplashScreen } from "@/components/opening-brand-logo";

/** Full browser refresh on a signed-in page ends the session and returns to the log on flow. */
export function ForceLoginOnReload() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!shouldRunForceLoginOnReload()) return;
    if (isEmbeddedBankApp()) return;

    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (entry?.type !== "reload") return;

    const loadPath = getDocumentLoadPath();
    if (!loadPath || !isProtectedAppPath(loadPath)) return;

    setRedirecting(true);
    void (async () => {
      await api("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
      setDocumentLoadPath("/login");
      skipNextLoginSplash();
      router.replace("/login");
    })();
  }, [router]);

  if (!redirecting) return null;
  return <OpeningSplashScreen />;
}
