#!/usr/bin/env bun
/**
 * Regression checks for folder subtree deletion invariants.
 * Run: bun scripts/test-folder-subtree.mjs
 */

import { collectSubtreeFolderIds } from "../lib/folder-subtree.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const folders = [
  { id: "root", parentId: null },
  { id: "child-a", parentId: "root" },
  { id: "child-b", parentId: "root" },
  { id: "grandchild", parentId: "child-a" },
  { id: "other-root", parentId: null },
  { id: "other-child", parentId: "other-root" },
];

const subtree = collectSubtreeFolderIds(folders, "root");

assert(subtree.has("root"), "root must be included");
assert(subtree.has("child-a"), "direct child must be included");
assert(subtree.has("child-b"), "second direct child must be included");
assert(subtree.has("grandchild"), "nested grandchild must be included");
assert(!subtree.has("other-root"), "unrelated root must be excluded");
assert(!subtree.has("other-child"), "unrelated branch must be excluded");
assert(subtree.size === 4, `expected 4 folders in subtree, got ${subtree.size}`);

process.stdout.write("folder-subtree invariants: ok\n");