import { THEME_STORAGE_KEY } from "@/lib/theme";

export const themeBootstrapScript = `
(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : storedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : 'light';

  if (storedTheme !== theme) {
    window.localStorage.setItem(storageKey, theme);
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
})();
`;
