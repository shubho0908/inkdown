export type Theme = "light" | "dark";
export type ResolvedTheme = Theme;

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "inkdown-theme-change";

/** SSR-safe theme snapshot for useSyncExternalStore server snapshots. */
export const SERVER_THEME_SNAPSHOT = "light" as const satisfies Theme;

/** SSR-safe resolved theme snapshot for diagram/preview consumers. */
export const SERVER_RESOLVED_THEME_SNAPSHOT = SERVER_THEME_SNAPSHOT;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}
