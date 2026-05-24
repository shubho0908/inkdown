export const dynamic = "force-static";

const API_DOCS = `# Inkdown API

Inkdown exposes authenticated workspace APIs for the web application and public discovery resources for agents.

## Discovery

- API catalog: /.well-known/api-catalog
- Sitemap: /sitemap.xml
- Robots and content signals: /robots.txt

## Content negotiation

Public HTML pages support Markdown for Agents. Send \`Accept: text/markdown\` to receive a markdown representation with \`Content-Type: text/markdown\` and \`X-Markdown-Tokens\`.

## Authenticated endpoints

These endpoints require a Supabase user session cookie.

| Path | Methods | Purpose |
| --- | --- | --- |
| /api/files | GET, POST | List and create workspace files |
| /api/files/{id} | GET, PATCH, DELETE | Read, update, or delete a workspace file |
| /api/folders | GET, POST | List and create workspace folders |
| /api/folders/{id} | PATCH, DELETE | Update or delete a workspace folder |
| /api/export/zip | POST | Export selected workspace content |
`;

export function GET() {
  return new Response(API_DOCS, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
