function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sanitizeFileNameSegment(value: string) {
  const normalized = normalizeWhitespace(value)
  const sanitized = normalized.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')

  return sanitized || 'Untitled'
}

export function ensureMarkdownFileName(fileName: string) {
  const sanitized = sanitizeFileNameSegment(fileName)
  return sanitized.toLowerCase().endsWith('.md') ? sanitized : `${sanitized}.md`
}

export function downloadMarkdownFile(fileName: string, content: string) {
  const blob = new Blob([content], {
    type: 'text/markdown;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = ensureMarkdownFileName(fileName)
  link.rel = 'noopener'
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 30_000)
}
