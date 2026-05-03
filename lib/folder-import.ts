export interface FileSystemEntryWithFile extends FileSystemEntry {
  file?: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void
}

// Safety limits to prevent stack overflow and memory issues
const MAX_DEPTH = 100
const MAX_ENTRIES = 10000

/**
 * Check if the browser supports webkitGetAsEntry
 */
export function supportsWebkitGetAsEntry(): boolean {
  return 'webkitGetAsEntry' in DataTransferItem.prototype || 'getAsEntry' in DataTransferItem.prototype
}

/**
 * Read all entries from a directory reader, handling the 100-entry limit in Chromium
 * This is critical - readEntries() only returns 100 entries max per call
 * Must call repeatedly until empty array is returned
 * Converted to iterative to prevent stack overflow
 */
async function readAllEntries(directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = []
  
  return new Promise((resolve, reject) => {
    const readEntries = () => {
      directoryReader.readEntries((results) => {
        if (results.length === 0) {
          resolve(entries)
          return
        }
        
        entries.push(...results)
        
        // Safety check for total entries
        if (entries.length > MAX_ENTRIES) {
          reject(new Error(`Too many entries (max ${MAX_ENTRIES})`))
          return
        }
        
        // Continue reading - there might be more
        readEntries()
      }, (error) => {
        reject(error)
      })
    }
    
    readEntries()
  })
}

/**
 * Iteratively traverse a directory entry to collect all files
 * Converted from recursive to iterative to prevent stack overflow
 */
async function traverseDirectory(
  directoryEntry: FileSystemDirectoryEntry,
  basePath: string = '',
): Promise<{ files: Array<{ file: File; relativePath: string }>; folderPaths: string[] }> {
  const files: Array<{ file: File; relativePath: string }> = []
  const folderPaths: string[] = []
  
  // Use a stack for iterative traversal instead of recursion
  const stack: Array<{ entry: FileSystemDirectoryEntry; path: string; depth: number }> = [
    { entry: directoryEntry, path: basePath, depth: 0 }
  ]
  
  while (stack.length > 0) {
    const { entry, path, depth } = stack.pop()!
    
    // Depth limit check to prevent stack overflow
    if (depth > MAX_DEPTH) {
      console.error(`Directory depth exceeds maximum (${MAX_DEPTH}), skipping: ${path}`)
      continue
    }
    
    try {
      const directoryReader = entry.createReader()
      const entries = await readAllEntries(directoryReader)
      
      for (const dirEntry of entries) {
        try {
          const entryPath = path ? `${path}/${dirEntry.name}` : dirEntry.name
          
          if (dirEntry.isDirectory) {
            folderPaths.push(entryPath)
            // Add to stack for processing (LIFO for depth-first, FIFO for breadth-first)
            stack.push({ entry: dirEntry as FileSystemDirectoryEntry, path: entryPath, depth: depth + 1 })
          } else if (dirEntry.isFile) {
            const fileEntry = dirEntry as FileSystemEntryWithFile
            const file = await new Promise<File>((resolve, reject) => {
              fileEntry.file?.(resolve, reject)
            })
            files.push({ file, relativePath: entryPath })
          }
        } catch (error) {
          console.error(`Error processing entry ${dirEntry.name}:`, error)
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${path}:`, error)
      // Continue with other directories instead of failing completely
    }
  }
  
  return { files, folderPaths }
}

/**
 * Parse dropped items using webkitGetAsEntry API
 * This is the modern, robust approach for folder drag-drop
 */
export async function parseDroppedItems(items: DataTransferItemList): Promise<{ files: Array<{ file: File; relativePath: string }>; folderPaths: string[] }> {
  const allFiles: Array<{ file: File; relativePath: string }> = []
  const allFolderPaths: string[] = []
  
  for (const item of items) {
    try {
      // Try getAsEntry first (standard), fallback to webkitGetAsEntry (older)
      // @ts-ignore - getAsEntry and webkitGetAsEntry are not in standard TypeScript definitions
      const entry = item.getAsEntry ? item.getAsEntry() : item.webkitGetAsEntry()
      
      if (!entry) {
        continue
      }
      
      if (entry.isDirectory) {
        // Add the root folder to folderPaths
        allFolderPaths.push(entry.name)
        const result = await traverseDirectory(entry as FileSystemDirectoryEntry, entry.name)
        allFiles.push(...result.files)
        allFolderPaths.push(...result.folderPaths)
      } else if (entry.isFile) {
        const fileEntry = entry as FileSystemEntryWithFile
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file?.(resolve, reject)
        })
        allFiles.push({ file, relativePath: file.name })
      }
    } catch (error) {
      // Log error but continue with other items
      console.error('Error processing dropped item:', error)
    }
  }
  
  return { files: allFiles, folderPaths: allFolderPaths }
}
