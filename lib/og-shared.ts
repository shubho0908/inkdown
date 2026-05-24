import { getSiteUrl } from "@/lib/site-url";

let ogLogoUrlPromise: Promise<string> | null = null;

function createFallbackLogoUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
      <rect width="180" height="180" rx="37" fill="#09090b"/>
      <g transform="translate(4.5 4.5) scale(0.95)">
        <path fill="#fafafa" d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z"/>
        <path fill="#fafafa" d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z"/>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
  return resolve(/*turbopackIgnore: true*/ resolveAssetPath("public/icon.svg"));
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

        return `data:image/svg+xml;base64,${icon.toString("base64")}`;
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
