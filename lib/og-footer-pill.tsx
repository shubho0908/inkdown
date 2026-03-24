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
        gap: '16px',
        width: '100%',
        minWidth: 0,
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.045)',
          padding: '10px 14px',
          flexShrink: 0,
        }}
      >
        <img
          src={logoUrl}
          width={22}
          height={22}
          alt=""
          style={{ display: 'block', borderRadius: '6px' }}
        />
        <span
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'rgba(248,250,252,0.9)',
            letterSpacing: '-0.02em',
          }}
        >
          {hostLabel}
        </span>
      </div>

      <div
        style={{
          height: '20px',
          width: '1px',
          background: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: 'rgba(226,232,240,0.6)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {trailingText}
      </span>
    </div>
  )
}
