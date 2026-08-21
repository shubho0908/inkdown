import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Pre-CSS canvas colors. Keep in sync with --background in app/globals.css. */
export const themeBootstrapStyle =
  "html{background-color:oklch(1 0 0);color-scheme:light}html.dark{background-color:oklch(0.145 0 0);color-scheme:dark}";

/**
 * Parser-blocking inline script for the root layout.
 *
 * Must be a native <script dangerouslySetInnerHTML>, not next/script.
 * App Router `beforeInteractive` only queues work on `self.__next_s` and
 * runs it after first paint, which is what caused the dark-mode white flash.
 */
export const themeBootstrapScript = `
(() => {
  try {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    let storedTheme = null;
    try {
      storedTheme = window.localStorage.getItem(storageKey);
    } catch (_) {}

    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : storedTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : 'light';

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;

    if (storedTheme !== theme) {
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (_) {}
    }
  } catch (_) {}
})();
`.trim();
