import type { ReactElement } from 'react'
import { FooterPill } from '@/lib/og-footer-pill'

interface MarketingContentProps {
  title: string
  hostLabel: string
  logoUrl: string
}

export function MarketingContent({
  title,
  hostLabel,
  logoUrl,
}: MarketingContentProps): ReactElement {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '840px',
          marginTop: '28px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '76px',
            lineHeight: 1.02,
            letterSpacing: '-0.07em',
            fontWeight: 800,
            whiteSpace: 'pre-wrap',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: '26px',
            lineHeight: 1.45,
            fontWeight: 500,
            color: 'rgba(226,232,240,0.72)',
          }}
        >
          Write, organize, preview, and share markdown with a cleaner workflow.
        </p>
      </div>

      <FooterPill
        hostLabel={hostLabel}
        logoUrl={logoUrl}
        trailingText="Share beautifully"
      />
    </>
  )
}
