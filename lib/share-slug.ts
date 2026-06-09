import { nanoid } from "nanoid";

const SHARE_SLUG_LENGTH = 10;
const MAX_SLUG_GENERATION_ATTEMPTS = 5;

export async function generateUniqueShareSlug(
  slugExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const candidates = Array.from({ length: MAX_SLUG_GENERATION_ATTEMPTS }, () =>
    nanoid(SHARE_SLUG_LENGTH),
  );
  const existenceResults = await Promise.all(candidates.map(slugExists));
  const availableIndex = existenceResults.findIndex((exists) => !exists);

  if (availableIndex === -1) {
    throw new Error("Could not generate a unique share slug");
  }

  return candidates[availableIndex];
}
