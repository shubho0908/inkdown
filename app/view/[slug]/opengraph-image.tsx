import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'MarkdownHub Document Preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: file } = await supabase
    .from('files')
    .select('name, content')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  const title = file?.name?.replace(/\.md$/, '') || 'Document'
  const preview = file?.content
    ?.split('\n')
    .filter((line: string) => line.trim() && !line.startsWith('#'))
    .slice(0, 3)
    .join(' ')
    .slice(0, 150) || 'Read this document on MarkdownHub'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#171717',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#171717' }}>
            MarkdownHub
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#171717',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#737373',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {preview}...
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: '#a3a3a3' }}>
            markdownhub.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
