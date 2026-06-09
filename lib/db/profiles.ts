import "server-only";

import { eq, ilike } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { profiles, user, type UserId } from "@/lib/db/schema";
import { generateProfileUsername } from "@/lib/db/username";

export async function getProfileUsername(userId: UserId) {
  const rows = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return rows[0]?.username ?? null;
}

export async function ensureProfile(input: {
  userId: UserId;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
}) {
  const username = await generateProfileUsername(input.email, input.userId);
  const emailVerifiedAt = input.emailVerifiedAt ? new Date(input.emailVerifiedAt) : null;

  await db
    .insert(profiles)
    .values({
      userId: input.userId,
      username,
      emailVerified: input.emailVerified,
      emailVerifiedAt,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        emailVerified: input.emailVerified,
        emailVerifiedAt,
        updatedAt: new Date(),
      },
    });
}

export async function emailExists(email: string) {
  const rows = await db.select({ id: user.id }).from(user).where(ilike(user.email, email)).limit(1);

  return rows.length > 0;
}
