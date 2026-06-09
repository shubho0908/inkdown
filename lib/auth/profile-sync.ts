import "server-only";

import { ensureProfile } from "@/lib/db/profiles";
import type { UserId } from "@/lib/db/schema";

export type AuthUserProfileSyncInput = {
  id: UserId;
  email: string;
  emailVerified?: boolean | null;
};

function buildProfileSyncInput(user: AuthUserProfileSyncInput) {
  const emailVerified = Boolean(user.emailVerified);

  return {
    userId: user.id,
    email: user.email,
    emailVerified,
    emailVerifiedAt: emailVerified ? new Date().toISOString() : null,
  };
}

export async function syncProfileForAuthUser(user: AuthUserProfileSyncInput) {
  await ensureProfile(buildProfileSyncInput(user));
}
