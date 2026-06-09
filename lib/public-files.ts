import "server-only";

import { cache } from "react";

import {
  getPublicFileBySlug as fetchPublicFileBySlug,
  listPublicFileRowsForSitemap,
} from "@/lib/db/files";
import { getProfileUsername } from "@/lib/db/profiles";
import { toFileMetadata } from "@/lib/db/rows";
import { readFileContent } from "@/lib/storage/content";
import type { File } from "@/lib/validation/models";

export type PublicFileRecord = File & {
  slug: string;
  content: string;
  username: string | null;
};

export const getPublicFileBySlug = cache(async (slug: string): Promise<PublicFileRecord | null> => {
  const file = await fetchPublicFileBySlug(slug);
  if (!file || !file.slug) return null;

  return {
    ...file,
    slug: file.slug,
    content: file.content ?? "",
    username: await getProfileUsername(file.user_id),
  };
});

export async function listPublicFilesForSitemap(): Promise<PublicFileRecord[]> {
  const rows = await listPublicFileRowsForSitemap();

  return Promise.all(
    rows.map(async (row) => {
      const content = await readFileContent(row.userId, row.id, row.contentKey);
      return {
        ...toFileMetadata(row),
        slug: row.slug ?? "",
        content,
        username: null,
      };
    }),
  );
}
