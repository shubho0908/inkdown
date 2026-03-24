import type { ReactElement } from 'react'
import { DocumentCopy } from '@/lib/og-document-copy'
import { DocumentPaper } from '@/lib/og-document-paper'
import { FooterPill } from '@/lib/og-footer-pill'

interface DocumentContentProps {
  title: string
  preview: string
  hostLabel: string
  logoUrl: string
}

export function DocumentContent({
  title,
  preview,
  hostLabel,
  logoUrl,
}: DocumentContentProps): ReactElement {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'stretch',
          gap: '36px',
          minHeight: 0,
        }}
      >
        <DocumentCopy title={title} preview={preview} />
        <DocumentPaper preview={preview} hostLabel={hostLabel} logoUrl={logoUrl} />
      </div>

      <FooterPill
        hostLabel={hostLabel}
        logoUrl={logoUrl}
        trailingText="Open the shared document"
      />
    </>
  )
}
