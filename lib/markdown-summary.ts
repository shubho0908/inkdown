const DEFAULT_SUMMARY =
  'Open the document to continue reading the shared markdown content.'

function stripMarkdown(content: string) {
  return content
    .replace(/\r\n?/g, '\n')
    .replace(/^---\n[\s\S]*?\n---\n?/u, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1 ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-+*]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clipAtBoundary(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text
  }

  const candidate = text.slice(0, maxLength + 1)
  const sentenceBoundary = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('! '),
    candidate.lastIndexOf('? '),
  )

  if (sentenceBoundary >= Math.floor(maxLength * 0.55)) {
    return candidate.slice(0, sentenceBoundary + 1).trim()
  }

  const wordBoundary = candidate.lastIndexOf(' ')

  if (wordBoundary >= Math.floor(maxLength * 0.6)) {
    return `${candidate.slice(0, wordBoundary).trim()}...`
  }

  return `${candidate.slice(0, maxLength).trim()}...`
}

export function extractMarkdownSummary(
  content: string,
  {
    fallback = DEFAULT_SUMMARY,
    maxLength = 200,
  }: {
    fallback?: string
    maxLength?: number
  } = {},
) {
  const plainText = stripMarkdown(content)

  if (!plainText) {
    return fallback
  }

  return clipAtBoundary(plainText, maxLength)
}
