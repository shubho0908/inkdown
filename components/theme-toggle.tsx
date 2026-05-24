"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { isTheme, THEME_STORAGE_KEY, type ResolvedTheme, type Theme } from "@/lib/theme";

const themeChangeEvent = "inkdown-theme-change";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const resolvedTheme = resolveTheme(theme);

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
}

function getStoredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : "system";
}

function getNextTheme(theme: Theme): Theme {
  if (theme === "system") {
    return "light";
  }

  return theme === "light" ? "dark" : "system";
}

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<Theme>("system");

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      const nextTheme = getStoredTheme();
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  const setTheme = (nextTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  const nextTheme = getNextTheme(theme);

  return (
    <button
      type="button"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50"
      onClick={() => setTheme(nextTheme)}
      title={`Theme: ${theme}. Switch to ${nextTheme}.`}
      aria-label={`Theme: ${theme}. Switch to ${nextTheme}.`}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

export { themeChangeEvent };
