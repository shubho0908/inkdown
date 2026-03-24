import type { ReactElement } from 'react'

interface FooterPillProps {
  hostLabel: string
  logoUrl: string
  trailingText: string
}

export function FooterPill({
  hostLabel,
  logoUrl,
  trailingText,
}: FooterPillProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.045)',
          padding: '12px 16px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          width={24}
          height={24}
          alt=""
          style={{ display: 'block', borderRadius: '6px' }}
        />
        <span
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'rgba(248,250,252,0.9)',
            letterSpacing: '-0.02em',
          }}
        >
          {hostLabel}
        </span>
      </div>

      <span
        style={{
          fontSize: '16px',
          fontWeight: 500,
          color: 'rgba(226,232,240,0.6)',
        }}
      >
        {trailingText}
      </span>
    </div>
  )
}
