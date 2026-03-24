import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Inkdown Document Preview'
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
    .slice(0, 150) || 'Read this document on Inkdown'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1a1333 0%, #0f0a1a 50%, #1a1333 100%)',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-50px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
          }}
        />

        {/* Header with logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            I
          </div>
          <span style={{ fontSize: '24px', fontWeight: 600, color: 'white' }}>
            Inkdown
          </span>
        </div>

        {/* Title and preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {preview}...
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
          <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
            inkdown.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
