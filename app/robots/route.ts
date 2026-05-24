import { headers } from "next/headers";
import { getRequestOrigin, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = getRequestOrigin(await headers());
  const siteUrl = getSiteUrl(origin);

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /auth/",
    "Disallow: /dashboard",
    "Disallow: /emails",
    "Content-Signal: ai-train=no, search=yes, ai-input=no",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${siteUrl}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
