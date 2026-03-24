import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Inkdown - Create, organize, and share markdown documents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          fontFamily: 'sans-serif',
          gap: '24px',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              fontWeight: 700,
              color: '#09090b',
            }}
          >
            I
          </div>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            Inkdown
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          Create, organize, and share markdown documents
        </p>
      </div>
    ),
    { ...size },
  )
}
