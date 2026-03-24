import type { ReactElement } from 'react'
import { DocumentContent } from '@/lib/og-document-content'
import { MarketingContent } from '@/lib/og-marketing-content'
import { clampText, getHostLabel, getOgBaseUrl } from '@/lib/og-shared'

interface OgCardProps {
  title: string
  preview?: string
  isDoc?: boolean
  baseUrl?: string
}

export function OgCard({
  title,
  preview = '',
  isDoc = false,
  baseUrl,
}: OgCardProps): ReactElement {
  const safeBaseUrl = getOgBaseUrl(baseUrl)
  const logoUrl = `${safeBaseUrl}/favicon.png`
  const hostLabel = getHostLabel(safeBaseUrl)
  const displayTitle = clampText(title || 'Untitled', isDoc ? 84 : 54)
  const displayPreview = clampText(preview, isDoc ? 260 : 160)

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top right, rgba(62, 78, 255, 0.15), transparent 30%), linear-gradient(180deg, #0b1220 0%, #09090b 100%)',
        color: '#f8fafc',
        fontFamily: 'Manrope',
      }}
    >
      {isDoc && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-80px',
              height: '360px',
              width: '360px',
              borderRadius: '999px',
              background: 'rgba(96,165,250,0.18)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-140px',
              left: '140px',
              height: '300px',
              width: '300px',
              borderRadius: '999px',
              background: 'rgba(251,191,36,0.08)',
              filter: 'blur(100px)',
            }}
          />
        </>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent 78%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '44px',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: '56px 64px',
          gap: '34px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              width={56}
              height={56}
              alt="Inkdown"
              style={{
                display: 'block',
                borderRadius: '14px',
                boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  letterSpacing: '-0.06em',
                  lineHeight: 1,
                }}
              >
                Inkdown
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'rgba(226,232,240,0.72)',
                }}
              >
                Markdown workspace
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'rgba(241,245,249,0.82)',
              letterSpacing: '0.02em',
            }}
          >
            {isDoc ? `Published on ${hostLabel}` : hostLabel}
          </div>
        </div>

        {isDoc ? (
          <DocumentContent
            title={displayTitle}
            preview={displayPreview}
            hostLabel={hostLabel}
            logoUrl={logoUrl}
          />
        ) : (
          <MarketingContent
            title={displayTitle}
            hostLabel={hostLabel}
            logoUrl={logoUrl}
          />
        )}
      </div>
    </div>
  )
}
