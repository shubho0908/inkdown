import { getSiteUrl } from "@/lib/site-url";

let ogLogoUrlPromise: Promise<string> | null = null;

function createFallbackLogoUrl() {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
      <rect width="180" height="180" rx="37" fill="#09090b"/>
      <text x="90" y="118" text-anchor="middle" font-size="100" font-weight="800" font-family="system-ui" fill="#fafafa">I</text>
    </svg>`,
  )}`;
}

function resolveAssetPath(relativePath: string): string {
  const cwd = process.cwd();

  if (process.env.NODE_ENV === "production") {
    return `${cwd}/${relativePath}`;
  }

  return `${cwd}/${relativePath}`;
}

async function getLogoPath(): Promise<string> {
  const { resolve } = await import("path");
  return resolve(/*turbopackIgnore: true*/ resolveAssetPath("public/logo.png"));
}

export function getOgBaseUrl(origin?: string) {
  return getSiteUrl(origin);
}

export function getOgLogoUrl() {
  if (!ogLogoUrlPromise) {
    ogLogoUrlPromise = (async () => {
      try {
        const { readFile } = await import("node:fs/promises");
        const logoPath = await getLogoPath();
        const icon = await readFile(logoPath);

        return `data:image/png;base64,${icon.toString("base64")}`;
      } catch (error) {
        console.warn("OG logo loading failed, falling back to inline logo.", error);
        return createFallbackLogoUrl();
      }
    })();
  }

  return ogLogoUrlPromise;
}

export function getHostLabel(baseUrl: string) {
  return new URL(baseUrl).host.replace(/^www\./, "");
}

export function clampText(text: string, limit: number) {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  const clipped = normalized.slice(0, limit + 1);
  const wordBoundary = clipped.lastIndexOf(" ");

  if (wordBoundary >= Math.floor(limit * 0.6)) {
    return `${clipped.slice(0, wordBoundary).trim()}...`;
  }

  return `${normalized.slice(0, limit - 3).trim()}...`;
}
