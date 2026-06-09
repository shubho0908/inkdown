#!/usr/bin/env bun
/**
 * Regression checks for folder drag-drop import invariants.
 * Run: bun scripts/test-folder-import.mjs
 */

import {
  collectFolderPathsFromRelativePath,
  hasStructuredImport,
  normalizeDroppedImportSelection,
  parseFilesFromWebkitRelativePaths,
} from "../lib/folder-import.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeFile(name, webkitRelativePath = "") {
  return { name, webkitRelativePath };
}

// Nested webkitRelativePath builds full folder tree
const nested = parseFilesFromWebkitRelativePaths([
  makeFile("a.md", "Concepts/ideas/a.md"),
  makeFile("b.md", "Concepts/ideas/nested/b.md"),
]);

assert(nested.folderPaths.includes("Concepts"), "missing Concepts folder");
assert(nested.folderPaths.includes("Concepts/ideas"), "missing Concepts/ideas folder");
assert(nested.folderPaths.includes("Concepts/ideas/nested"), "missing nested folder");
assert(nested.files.length === 2, "expected two parsed files");

// Normalization fills missing folder paths from file relative paths
const normalized = normalizeDroppedImportSelection({
  files: [{ file: makeFile("note.md"), relativePath: "Dropped/note.md" }],
  folderPaths: [],
});

assert(hasStructuredImport(normalized), "nested relative paths must be treated as structured");
assert(normalized.folderPaths.includes("Dropped"), "normalization must derive parent folders");

// Flat files stay flat
const flat = normalizeDroppedImportSelection({
  files: [
    { file: makeFile("one.md"), relativePath: "one.md" },
    { file: makeFile("two.md"), relativePath: "two.md" },
  ],
  folderPaths: [],
});

assert(!hasStructuredImport(flat), "loose files must remain flat imports");
assert(flat.folderPaths.length === 0, "flat imports must not invent folders");

assert(
  collectFolderPathsFromRelativePath("Root/child/file.md").join(",") === "Root,Root/child",
  "folder path collection must include intermediates",
);

process.stdout.write("folder-import invariants: ok\n");