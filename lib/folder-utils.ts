/**
 * Convert kebab-case folder name to title case with spaces
 * Example: "hello-world-api" -> "Hello World Api"
 */
export function formatFolderName(name: string): string {
  // Handle empty or special cases
  if (!name || name.trim().length === 0) {
    return 'Untitled'
  }
  
  // Limit name length to prevent database issues
  const maxLength = 255
  const trimmedName = name.trim().slice(0, maxLength)
  
  return trimmedName
    .split('-')
    .map((word) => {
      if (word.length === 0) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim() || 'Untitled'
}
