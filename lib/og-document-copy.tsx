import type { ReactElement } from 'react'

interface DocumentCopyProps {
  title: string
  preview: string
  username?: string | null
}

export function DocumentCopy({
  title,
  preview: _preview,
  username,
}: DocumentCopyProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minWidth: 0,
        padding: '0 40px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1
          style={{
            margin: 0,
            width: '100%',
            maxWidth: '860px',
            fontSize: '112px',
            lineHeight: 0.88,
            letterSpacing: '-0.1em',
            fontWeight: 800,
            color: '#f8fafc',
            fontFamily: '"Playfair Display"',
            whiteSpace: 'pre-wrap',
          }}
        >
          {title}
        </h1>

        {username && (
          <p
            style={{
              margin: 0,
              fontSize: '28px',
              lineHeight: 1.2,
              fontWeight: 500,
              color: 'rgba(226,232,240,0.72)',
              fontFamily: 'Geist',
            }}
          >
            {username}
          </p>
        )}
      </div>
    </div>
  )
}
