const fontCache = new Map<string, Promise<ArrayBuffer>>()

async function getFontPath(relativePath: string): Promise<string> {
  // Use process.cwd() for serverless compatibility (Vercel, etc.)
  // import.meta.url doesn't work reliably in production serverless environments
  const { resolve } = await import('path')
  return resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    relativePath,
  )
}

async function loadLocalFont(relativePath: string) {
  const cacheKey = relativePath

  if (!fontCache.has(cacheKey)) {
    fontCache.set(
      cacheKey,
      (async () => {
        const { readFile } = await import('node:fs/promises')
        const fontPath = await getFontPath(relativePath)
        const font = await readFile(fontPath)

        return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength)
      })(),
    )
  }

  return fontCache.get(cacheKey)!
}

export async function getOgFonts() {
  try {
    const [regular, playfairExtraBold] = await Promise.all([
      loadLocalFont('public/fonts/Geist-Regular.ttf'),
      loadLocalFont('public/fonts/PlayfairDisplay-ExtraBold.ttf'),
    ])

    return [
      { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Geist', data: regular, weight: 500 as const, style: 'normal' as const },
      { name: 'Geist', data: regular, weight: 700 as const, style: 'normal' as const },
      { name: 'Geist', data: regular, weight: 800 as const, style: 'normal' as const },
      {
        name: 'Playfair Display',
        data: playfairExtraBold,
        weight: 800 as const,
        style: 'normal' as const,
      },
    ]
  } catch (error) {
    console.warn('OG font loading failed, falling back to default fonts.', error)
    return []
  }
}
