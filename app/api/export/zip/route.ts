import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { listFileExportRowsByUserId } from "@/lib/db/files";
import { listFoldersByUserId } from "@/lib/db/folders";
import { readFileContent } from "@/lib/storage/content";
import { parseJsonBody } from "@/lib/validation/parse";
import { exportZipBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "node:stream";

function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none';",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function buildFolderPath(
  folderId: string | null,
  folderMap: Map<string, { id: string; name: string; parent_id: string | null }>,
): string {
  if (!folderId) return "";

  const parts: string[] = [];
  let current = folderMap.get(folderId);

  while (current) {
    parts.unshift(sanitizeFileName(current.name));
    current = current.parent_id ? folderMap.get(current.parent_id) : undefined;
  }

  return parts.join("/");
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "Untitled";
}

function ensureMarkdownExtension(name: string): string {
  const sanitized = sanitizeFileName(name);
  return sanitized.toLowerCase().endsWith(".md") ? sanitized : `${sanitized}.md`;
}

function getFolderDescendants(
  folderId: string,
  folderMap: Map<string, { id: string; parent_id: string | null }>,
): Set<string> {
  const descendants = new Set<string>([folderId]);
  const queue = [folderId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [, folder] of folderMap) {
      if (folder.parent_id === current) {
        descendants.add(folder.id);
        queue.push(folder.id);
      }
    }
  }

  return descendants;
}

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: getSecurityHeaders() });
}

async function readExportFolderId(request: Request) {
  const parsed = await parseJsonBody(request, exportZipBodySchema);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.folderId ?? null;
}

export async function GET() {
  return createErrorResponse("Use POST to export ZIP archives", 405);
}

export async function POST(request: Request) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  try {
    const folderId = await readExportFolderId(request);
    const userId = authState.user.id;

    const [files, folders] = await Promise.all([
      listFileExportRowsByUserId(userId),
      listFoldersByUserId(userId),
    ]);

    const folderMap = new Map(folders.map((f) => [f.id, f]));
    const archive = archiver("zip", { zlib: { level: 6 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    async function appendFile(file: (typeof files)[number], fullPath: string) {
      const content = await readFileContent(userId, file.id, file.contentKey);
      archive.append(content || "# Empty Document\n", {
        name: fullPath,
        date: file.updatedAt ? new Date(file.updatedAt) : new Date(),
      });
    }

    if (folderId) {
      const folder = folderMap.get(folderId);
      if (!folder) {
        return createErrorResponse("Folder not found", 404);
      }

      const descendants = getFolderDescendants(folderId, folderMap);
      const folderFiles = files.filter((f) => f.folderId && descendants.has(f.folderId));

      if (folderFiles.length === 0) {
        return createErrorResponse("Folder is empty", 400);
      }

      const basePath = buildFolderPath(folderId, folderMap);

      await Promise.all(
        folderFiles.map((file) => {
          const relativePath = buildFolderPath(file.folderId, folderMap).slice(basePath.length + 1);
          const fileName = ensureMarkdownExtension(file.name);
          const fullPath = relativePath ? `${relativePath}/${fileName}` : fileName;
          return appendFile(file, fullPath);
        }),
      );

      archive.finalize();

      const timestamp = new Date().toISOString().split("T")[0];
      const downloadName = `${sanitizeFileName(folder.name)}-${timestamp}.zip`;

      return new Response(passThrough as unknown as ReadableStream, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          ...getSecurityHeaders(),
        },
      });
    }

    if (files.length === 0 && folders.length === 0) {
      return createErrorResponse("No files to export", 400);
    }

    for (const folder of folders) {
      const folderPath = buildFolderPath(folder.id, folderMap);
      if (folderPath) {
        archive.append("", { name: `${folderPath}/.folder` });
      }
    }

    await Promise.all(
      files.map((file) => {
        const folderPath = buildFolderPath(file.folderId, folderMap);
        const fileName = ensureMarkdownExtension(file.name);
        const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
        return appendFile(file, fullPath);
      }),
    );

    archive.finalize();

    const timestamp = new Date().toISOString().split("T")[0];

    return new Response(passThrough as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="inkdown-export-${timestamp}.zip"`,
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Zip export failed:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Export failed", 500);
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
