"use client";

import { useLayoutEffect } from "react";
import { applyStoredAppPreferences } from "@/lib/app-preferences";

export function AppPreferencesProvider() {
  useLayoutEffect(() => {
    applyStoredAppPreferences();
  }, []);
  return null;
}
