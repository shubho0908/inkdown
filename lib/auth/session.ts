import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/better-auth";
import type { VerifiedUserResult } from "@/lib/auth/shared";

export const getServerSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export const requireVerifiedUser = cache(async (): Promise<VerifiedUserResult> => {
  const session = await getServerSession();

  if (!session?.user) {
    return { kind: "unauthenticated" };
  }

  const user = session.user;

  if (!user.emailVerified) {
    return {
      kind: "unverified",
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: null,
        confirmed_at: null,
      },
    };
  }

  // Better Auth is the source of truth once emailVerified is true.
  // Profile rows are kept in sync via databaseHooks; no extra round-trip on hot paths.
  return {
    kind: "authenticated",
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: null,
      confirmed_at: null,
    },
  };
});
