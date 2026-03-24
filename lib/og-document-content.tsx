import type { ReactElement } from 'react'
import { DocumentCopy } from '@/lib/og-document-copy'

interface DocumentContentProps {
  title: string
  preview: string
  username?: string | null
  hostLabel: string
  logoUrl: string
}

export function DocumentContent({
  title,
  preview,
  username,
  hostLabel: _hostLabel,
  logoUrl: _logoUrl,
}: DocumentContentProps): ReactElement {
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
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          width: '100%',
        }}
      >
        <DocumentCopy title={title} preview={preview} username={username} />
      </div>
    </div>
  )
}
