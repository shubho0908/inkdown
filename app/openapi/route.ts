import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = getSiteUrl(new URL(request.url).origin);

  return Response.json(
    {
      openapi: "3.1.0",
      info: {
        title: "Inkdown API",
        version: "1.0.0",
        description: "Authenticated workspace APIs and public discovery endpoints for Inkdown.",
      },
      servers: [{ url: origin }],
      paths: {
        "/api/health": {
          get: {
            summary: "Service health check",
            responses: {
              "200": {
                description: "Service is healthy",
              },
            },
          },
        },
        "/api/files": {
          get: {
            summary: "List workspace files",
            security: [{ cookieSession: [] }],
            responses: {
              "200": { description: "Workspace files" },
              "401": { description: "Authentication required" },
            },
          },
          post: {
            summary: "Create a workspace file",
            security: [{ cookieSession: [] }],
            responses: {
              "201": { description: "File created" },
              "401": { description: "Authentication required" },
            },
          },
        },
        "/api/files/{id}": {
          get: {
            summary: "Read a workspace file",
            security: [{ cookieSession: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": { description: "Workspace file" },
              "404": { description: "File not found" },
            },
          },
          patch: {
            summary: "Update a workspace file",
            security: [{ cookieSession: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": { description: "File updated" },
              "404": { description: "File not found" },
            },
          },
          delete: {
            summary: "Delete a workspace file",
            security: [{ cookieSession: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": { description: "File deleted" },
              "404": { description: "File not found" },
            },
          },
        },
        "/api/folders": {
          get: {
            summary: "List workspace folders",
            security: [{ cookieSession: [] }],
            responses: {
              "200": { description: "Workspace folders" },
              "401": { description: "Authentication required" },
            },
          },
          post: {
            summary: "Create a workspace folder",
            security: [{ cookieSession: [] }],
            responses: {
              "201": { description: "Folder created" },
              "401": { description: "Authentication required" },
            },
          },
        },
        "/api/export/zip": {
          post: {
            summary: "Export workspace content as a zip archive",
            security: [{ cookieSession: [] }],
            responses: {
              "200": { description: "Zip archive" },
              "401": { description: "Authentication required" },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          cookieSession: {
            type: "apiKey",
            in: "cookie",
            name: "sb-access-token",
          },
        },
      },
    },
    {
      headers: {
        "Content-Type": "application/openapi+json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
