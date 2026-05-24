import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = getSiteUrl(new URL(request.url).origin);
  const openApiUrl = `${origin}/openapi.json`;
  const docsUrl = `${origin}/docs/api`;
  const healthUrl = `${origin}/api/health`;

  return Response.json(
    {
      linkset: [
        {
          anchor: `${origin}/api`,
          "service-desc": [
            {
              href: openApiUrl,
              type: "application/openapi+json",
            },
          ],
          "service-doc": [
            {
              href: docsUrl,
              type: "text/markdown",
            },
          ],
          status: [
            {
              href: healthUrl,
              type: "application/json",
            },
          ],
          describedby: [
            {
              href: `${origin}/sitemap.xml`,
              type: "application/xml",
            },
            {
              href: `${origin}/robots.txt`,
              type: "text/plain",
            },
          ],
        },
      ],
      service: {
        name: "Inkdown API Catalog",
        version: "1.0",
        description:
          "Machine-readable discovery metadata for Inkdown public resources and authenticated workspace APIs.",
        homepage: origin,
        resources: {
          openapi: openApiUrl,
          apiDocumentation: docsUrl,
          health: healthUrl,
          sitemap: `${origin}/sitemap.xml`,
          robots: `${origin}/robots.txt`,
        },
        contentNegotiation: {
          markdown: {
            accept: "text/markdown",
            contentType: "text/markdown; charset=utf-8",
            supportedPublicPaths: [
              "/",
              "/privacy",
              "/terms",
              "/view/{slug}",
              "/view/folder/{slug}",
            ],
          },
        },
      },
      endpoints: [
        {
          path: "/api/files",
          methods: ["GET", "POST"],
          authentication: "Supabase user session",
          description: "List and create files in the authenticated workspace.",
        },
        {
          path: "/api/files/{id}",
          methods: ["GET", "PATCH", "DELETE"],
          authentication: "Supabase user session",
          description: "Read, update, or delete an authenticated workspace file.",
        },
        {
          path: "/api/folders",
          methods: ["GET", "POST"],
          authentication: "Supabase user session",
          description: "List and create folders in the authenticated workspace.",
        },
        {
          path: "/api/folders/{id}",
          methods: ["PATCH", "DELETE"],
          authentication: "Supabase user session",
          description: "Update or delete an authenticated workspace folder.",
        },
        {
          path: "/api/export/zip",
          methods: ["POST"],
          authentication: "Supabase user session",
          description: "Export selected workspace content as a zip archive.",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Content-Type": "application/linkset+json; charset=utf-8",
      },
    },
  );
}
