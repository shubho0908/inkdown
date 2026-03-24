import type { ReactElement } from 'react'

interface MarketingContentProps {
  title: string
  hostLabel: string
  logoUrl: string
}

export function MarketingContent({
  title,
  hostLabel: _hostLabel,
  logoUrl: _logoUrl,
}: MarketingContentProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0 40px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            margin: 0,
            width: '100%',
            maxWidth: '860px',
            fontSize: '92px',
            lineHeight: 0.9,
            letterSpacing: '-0.07em',
            fontWeight: 800,
            color: '#f8fafc',
            fontFamily: 'Geist',
            whiteSpace: 'pre-wrap',
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  )
}
