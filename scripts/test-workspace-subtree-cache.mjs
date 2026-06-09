#!/usr/bin/env bun
/**
 * Regression checks for optimistic workspace subtree cache filtering.
 * Run: bun scripts/test-workspace-subtree-cache.mjs
 */

import {
  filterFilesExcludingSubtree,
  filterFoldersExcludingSubtree,
} from "../lib/workspace-subtree-cache.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const folders = [
  { id: "root", parent_id: null },
  { id: "child-a", parent_id: "root" },
  { id: "child-b", parent_id: "root" },
  { id: "grandchild", parent_id: "child-a" },
  { id: "other-root", parent_id: null },
];

const files = [
  { id: "file-root", folder_id: "root" },
  { id: "file-child", folder_id: "child-a" },
  { id: "file-grandchild", folder_id: "grandchild" },
  { id: "file-other", folder_id: "other-root" },
  { id: "file-loose", folder_id: null },
];

const remainingFolders = filterFoldersExcludingSubtree(folders, "root");
assert(remainingFolders.length === 1, "only unrelated root folder should remain");
assert(remainingFolders[0].id === "other-root", "unrelated root folder must remain");

const { files: remainingFiles, removedFileIds } = filterFilesExcludingSubtree(
  files,
  folders,
  "root",
);
assert(remainingFiles.length === 2, "only files outside deleted subtree should remain");
assert(
  remainingFiles.some((file) => file.id === "file-other"),
  "file in unrelated folder must remain",
);
assert(
  remainingFiles.some((file) => file.id === "file-loose"),
  "root-level file must remain",
);
assert(removedFileIds.length === 3, "all subtree files should be removed");
assert(removedFileIds.includes("file-grandchild"), "nested file must be removed");

process.stdout.write("workspace-subtree-cache invariants: ok\n");