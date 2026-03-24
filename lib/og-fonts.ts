const FONT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const fontCache = new Map<string, Promise<ArrayBuffer>>()

function getFontUrl(css: string) {
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype|woff2|woff)'\)/)

  if (!match) {
    throw new Error('Unable to resolve OG font URL')
  }

  return match[1]
}

async function loadGoogleFont(family: string, weight: number) {
  const cacheKey = `${family}-${weight}`

  if (!fontCache.has(cacheKey)) {
    fontCache.set(
      cacheKey,
      (async () => {
        const cssUrl = new URL('https://fonts.googleapis.com/css2')
        cssUrl.searchParams.set('family', `${family}:wght@${weight}`)
        cssUrl.searchParams.set('display', 'swap')

        const cssResponse = await fetch(cssUrl, {
          headers: { 'User-Agent': FONT_USER_AGENT },
          cache: 'force-cache',
        })

        if (!cssResponse.ok) {
          throw new Error(`Failed to load OG font CSS for ${family} ${weight}`)
        }

        const css = await cssResponse.text()
        const fontUrl = getFontUrl(css)
        const fontResponse = await fetch(fontUrl, { cache: 'force-cache' })

        if (!fontResponse.ok) {
          throw new Error(`Failed to load OG font file for ${family} ${weight}`)
        }

        return fontResponse.arrayBuffer()
      })(),
    )
  }

  return fontCache.get(cacheKey)!
}

export async function getOgFonts() {
  const [medium, bold, extraBold] = await Promise.all([
    loadGoogleFont('Manrope', 500),
    loadGoogleFont('Manrope', 700),
    loadGoogleFont('Manrope', 800),
  ])

  return [
    { name: 'Manrope', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Manrope', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Manrope', data: extraBold, weight: 800 as const, style: 'normal' as const },
  ]
}
