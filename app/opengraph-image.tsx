import { createOgImageResponse, OG_IMAGE_SIZE } from '@/lib/og-image-response'

export const alt = 'Inkdown - Create, organize, and share markdown documents'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return createOgImageResponse({
    title: 'Your markdown,\nbeautifully organized.',
  })
}
