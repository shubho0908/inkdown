"use client";

import { useLayoutEffect } from "react";

import { applyThemeToDocument, readStoredTheme } from "@/lib/theme-client";

export function ThemeSync() {
  useLayoutEffect(() => {
    applyThemeToDocument(readStoredTheme());
  }, []);

  return null;
}
