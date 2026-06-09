import { AUTH_EMAIL_LOGO_PATH } from "@/lib/email/constants";
import { getSiteUrl } from "@/lib/site-url";

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Public HTTPS origin for email image fallbacks (never localhost). */
export function getAuthEmailAssetBaseUrl(): string {
  const configured = process.env.AUTH_EMAIL_ASSET_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  const siteUrl = getSiteUrl();

  try {
    const hostname = new URL(siteUrl).hostname;
    if (!LOCALHOST_HOSTNAMES.has(hostname)) {
      return siteUrl;
    }
  } catch {
    // Fall through to site URL below.
  }

  return siteUrl;
}

/** Browser preview URL for the email logo (same-origin in dev). */
export function getAuthEmailLogoPreviewUrl(): string {
  return `${getSiteUrl()}${AUTH_EMAIL_LOGO_PATH}`;
}

/** Production-safe absolute URL for the email logo. */
export function getAuthEmailLogoPublicUrl(): string {
  return `${getAuthEmailAssetBaseUrl()}${AUTH_EMAIL_LOGO_PATH}`;
}
