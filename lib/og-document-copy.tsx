import type { ReactElement } from 'react'

interface DocumentCopyProps {
  title: string
  preview: string
}

export function DocumentCopy({
  title,
  preview,
}: DocumentCopyProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: 0,
        paddingTop: '22px',
        paddingBottom: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              height: '10px',
              width: '10px',
              borderRadius: '999px',
              background: '#6ea8ff',
              boxShadow: '0 0 24px rgba(110,168,255,0.7)',
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(226,232,240,0.68)',
            }}
          >
            Public markdown document
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            maxWidth: '520px',
            fontSize: '74px',
            lineHeight: 0.96,
            letterSpacing: '-0.08em',
            fontWeight: 800,
            whiteSpace: 'pre-wrap',
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '500px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(226,232,240,0.54)',
          }}
        >
          Preview
        </span>
        <p
          style={{
            margin: 0,
            fontSize: '23px',
            lineHeight: 1.48,
            fontWeight: 500,
            color: 'rgba(226,232,240,0.78)',
          }}
        >
          {preview || 'Open the document to continue reading the shared markdown content.'}
        </p>
      </div>
    </div>
  )
}
