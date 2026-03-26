import { nanoid } from 'nanoid'

const SHARE_SLUG_LENGTH = 10
const MAX_SLUG_GENERATION_ATTEMPTS = 5

export async function generateUniqueShareSlug(
  slugExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_SLUG_GENERATION_ATTEMPTS; attempt += 1) {
    const slug = nanoid(SHARE_SLUG_LENGTH)

    if (!(await slugExists(slug))) {
      return slug
    }
  }

  throw new Error('Could not generate a unique share slug')
}
