import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Untitled'
  const preview = searchParams.get('preview') ?? 'Read this document on Inkdown.'
  const isDoc = searchParams.get('doc') === '1'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#09090b',
            }}
          >
            I
          </div>
          <span style={{ fontSize: '22px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px' }}>
            Inkdown
          </span>
        </div>

        {/* Middle: title + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1
            style={{
              fontSize: isDoc ? '52px' : '64px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-1px',
              maxWidth: '900px',
            }}
          >
            {title}
          </h1>
          {isDoc && preview && (
            <p
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '820px',
              }}
            >
              {preview}
            </p>
          )}
        </div>

        {/* Bottom: URL */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' }}>
            inkdown.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
