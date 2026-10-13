"use client";

import { useEffect } from "react";
import { flushPendingLoginLocation } from "@/lib/login-location-client";

/** Retries GPS/IP location reporting if the browser blocked it during log on. */
export function LoginLocationFlush() {
  useEffect(() => {
    void flushPendingLoginLocation();
  }, []);
  return null;
}
