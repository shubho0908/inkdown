/** Client-safe redirect target sanitizer (no server-only imports). */
export function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/workspace";
  }

  return next;
}
