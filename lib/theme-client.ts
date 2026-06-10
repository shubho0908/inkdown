"use client";

import {
  isTheme,
  SERVER_RESOLVED_THEME_SNAPSHOT,
  SERVER_THEME_SNAPSHOT,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

function assertBrowser(label: string): void {
  if (typeof window === "undefined") {
    throw new Error(
      `${label} is only available in the browser. Use useTheme() / useResolvedTheme().`,
    );
  }
}

function resolveLegacyStoredTheme(storedTheme: string | null): Theme {
  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  if (storedTheme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return SERVER_THEME_SNAPSHOT;
}

function persistThemeIfNeeded(previousValue: string | null, theme: Theme): void {
  if (previousValue !== theme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return SERVER_THEME_SNAPSHOT;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const theme = resolveLegacyStoredTheme(storedTheme);
  persistThemeIfNeeded(storedTheme, theme);
  return theme;
}

export function readResolvedTheme(): ResolvedTheme {
  return readStoredTheme();
}

function applyThemeToDocument(theme: Theme): void {
  assertBrowser("applyThemeToDocument");

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function writeStoredTheme(theme: Theme): void {
  assertBrowser("writeStoredTheme");

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeToDocument(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getNextThemePreference(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function subscribeToThemeStore(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

export function getServerThemeSnapshot(): Theme {
  return SERVER_THEME_SNAPSHOT;
}

export function getServerResolvedThemeSnapshot(): ResolvedTheme {
  return SERVER_RESOLVED_THEME_SNAPSHOT;
}
