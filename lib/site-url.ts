const FALLBACK_SITE_URL = "https://inkdown.shubhojeet.com";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

interface HeaderLookup {
  get(name: string): string | null;
}

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

function getForwardedHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function getSiteUrl(origin?: string) {
  if (origin) {
    return normalizeSiteUrl(new URL("/", origin).toString());
  }

  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL,
  );
}

export function getRequestOrigin(headers: HeaderLookup) {
  const forwardedHost = getForwardedHeaderValue(headers.get("x-forwarded-host"));
  const host = forwardedHost || getForwardedHeaderValue(headers.get("host"));

  if (!host) {
    return undefined;
  }

  const forwardedProto = getForwardedHeaderValue(headers.get("x-forwarded-proto"));
  const proto =
    forwardedProto && forwardedProto.length > 0
      ? forwardedProto
      : LOCALHOST_HOSTNAMES.has(host.split(":")[0] ?? "")
        ? "http"
        : "https";

  return normalizeSiteUrl(`${proto}://${host}`);
}

export function getSiteUrlObject(origin?: string) {
  return new URL(getSiteUrl(origin));
}

export function createSiteUrl(path = "/", origin?: string) {
  return new URL(path, `${getSiteUrl(origin)}/`);
}
