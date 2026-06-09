import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { profiles, type UserId } from "@/lib/db/schema";

function deriveBaseUsername(email: string) {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const base = localPart.replace(/[^a-z0-9_]/g, "");
  return base || "user";
}

export async function generateProfileUsername(email: string, userId: UserId) {
  const baseUsername = deriveBaseUsername(email);
  const idSuffix = userId.replace(/-/g, "").slice(0, 6);
  let candidate = baseUsername;
  let attempt = 0;

  while (attempt < 20) {
    const conflicting = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.username, candidate), ne(profiles.userId, userId)))
      .limit(1);

    if (conflicting.length === 0) {
      return candidate;
    }

    attempt += 1;
    candidate =
      attempt === 1 ? `${baseUsername}_${idSuffix}` : `${baseUsername}_${idSuffix}${attempt}`;
  }

  return `${baseUsername}_${userId.slice(0, 12)}`;
}
