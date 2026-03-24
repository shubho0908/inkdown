import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Inkdown - Create, organize, and share markdown documents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LOGO_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-NaCZXqV6iSYfQnwfTfaesq1TPmTWTw.png'

export default function Image() {
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
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot-grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            display: 'flex',
          }}
        />

        {/* Soft glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '56px 64px',
            position: 'relative',
          }}
        >
          {/* TOP: Logo lockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              width={52}
              height={52}
              style={{ borderRadius: '12px', display: 'block' }}
              alt="Inkdown"
            />
            <span
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.5px',
              }}
            >
              Inkdown
            </span>
          </div>

          {/* MIDDLE: Hero text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '860px',
            }}
          >
            <h1
              style={{
                fontSize: '76px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: '-2px',
              }}
            >
              Your markdown,{'\n'}beautifully organized.
            </h1>
            <p
              style={{
                fontSize: '26px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.45)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Write. Organize. Share — from any device.
            </p>
          </div>

          {/* BOTTOM: URL pill */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: '999px',
                padding: '8px 18px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_URL}
                width={18}
                height={18}
                style={{ borderRadius: '4px', display: 'block' }}
                alt=""
              />
              <span
                style={{
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.2px',
                }}
              >
                inkdown.app
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
