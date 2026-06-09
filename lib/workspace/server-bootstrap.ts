import "server-only";

import { cache } from "react";

import { listFileMetadataByUserId } from "@/lib/db/files";
import { listFoldersByUserId } from "@/lib/db/folders";

export const getWorkspaceBootstrapData = cache(async (userId: string) => {
  const [files, folders] = await Promise.all([
    listFileMetadataByUserId(userId),
    listFoldersByUserId(userId),
  ]);

  return { files, folders };
});
