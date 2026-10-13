"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { captureDocumentLoadPath } from "@/lib/document-load-path";

export function DocumentLoadCapture() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    captureDocumentLoadPath(pathname);
  }, [pathname]);

  return null;
}
