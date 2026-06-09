function isFileSystemEntry(value: unknown): value is FileSystemEntry {
  return typeof value === "object" && value !== null && "isFile" in value && "isDirectory" in value;
}

function callDataTransferEntryMethod(
  item: DataTransferItem,
  method: "getAsEntry" | "webkitGetAsEntry",
): FileSystemEntry | null {
  const record = item as unknown as Record<string, unknown>;
  const candidate = record[method];

  if (typeof candidate !== "function") {
    return null;
  }

  const entry = candidate.call(item);
  return isFileSystemEntry(entry) ? entry : null;
}

export function getDataTransferEntry(item: DataTransferItem): FileSystemEntry | null {
  return (
    callDataTransferEntryMethod(item, "getAsEntry") ??
    callDataTransferEntryMethod(item, "webkitGetAsEntry")
  );
}
