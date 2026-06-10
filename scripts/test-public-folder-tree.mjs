#!/usr/bin/env bun
/**
 * Regression checks for public shared folder tree building.
 * Run: bun scripts/test-public-folder-tree.mjs
 */

import { buildPublicFolderTree, findFirstFileInTree } from "../lib/workspace-tree.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const base = {
  is_public: false,
  slug: null,
  user_id: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const sharedRootId = "shared-root";
const nestedFolders = [
  {
    id: sharedRootId,
    name: "Yt Trans",
    parent_id: "workspace-parent",
    is_public: true,
    slug: "yFcoCbQiIc",
    ...base,
  },
  ...Array.from({ length: 14 }, (_, index) => ({
    id: `child-${index}`,
    name: `Subfolder ${index}`,
    parent_id: index === 0 ? sharedRootId : `child-${index - 1}`,
    ...base,
  })),
];

const nestedFiles = Array.from({ length: 14 }, (_, index) => ({
  id: `file-${index}`,
  name: `note-${index}.md`,
  folder_id: "child-13",
  ...base,
}));

const nestedTree = buildPublicFolderTree(sharedRootId, nestedFolders, nestedFiles);

assert(nestedTree.length === 1, "nested shared folder must render a single virtual root");
assert(nestedTree[0].id === sharedRootId, "virtual root must be the shared folder");
assert(nestedTree[0].type === "folder", "virtual root must remain a folder node");
assert(
  (nestedTree[0].children?.length ?? 0) > 0,
  "nested shared folder must expose descendants in the tree",
);
assert(
  findFirstFileInTree(nestedTree) === "file-0",
  "nested shared folder must surface the first nested markdown file",
);

const topLevelFolders = [
  {
    id: sharedRootId,
    name: "Workspace Root Share",
    parent_id: null,
    is_public: true,
    slug: "top-level-share",
    ...base,
  },
  {
    id: "child-a",
    name: "Child A",
    parent_id: sharedRootId,
    ...base,
  },
];

const topLevelFiles = [
  {
    id: "top-file",
    name: "readme.md",
    folder_id: "child-a",
    ...base,
  },
];

const topLevelTree = buildPublicFolderTree(sharedRootId, topLevelFolders, topLevelFiles);

assert(topLevelTree.length === 1, "top-level shared folder must still render one root");
assert(
  findFirstFileInTree(topLevelTree) === "top-file",
  "top-level shared folder must still surface nested files",
);

process.stdout.write("public-folder-tree invariants: ok\n");