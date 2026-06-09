"use client";

import { Moon, Sun } from "lucide-react";

import { useThemeActions } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, nextTheme, setTheme } = useThemeActions();

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
