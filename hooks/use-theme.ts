"use client";

import { useSyncExternalStore } from "react";

import {
  getNextThemePreference,
  getServerResolvedThemeSnapshot,
  getServerThemeSnapshot,
  readResolvedTheme,
  readStoredTheme,
  subscribeToThemeStore,
  writeStoredTheme,
} from "@/lib/theme-client";
import type { ResolvedTheme, Theme } from "@/lib/theme";

function useTheme(): Theme {
  return useSyncExternalStore(subscribeToThemeStore, readStoredTheme, getServerThemeSnapshot);
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribeToThemeStore,
    readResolvedTheme,
    getServerResolvedThemeSnapshot,
  );
}

export function useThemeActions() {
  const theme = useTheme();

  return {
    theme,
    nextTheme: getNextThemePreference(theme),
    setTheme: writeStoredTheme,
  };
}
