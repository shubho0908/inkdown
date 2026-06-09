import "server-only";

import { NextResponse } from "next/server";
import {
  getEmailVerificationRedirectPath,
  VERIFICATION_RESEND_SOURCE,
} from "@/lib/auth/email-verification-flow";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { isUserEmailVerified } from "@/lib/auth/shared";
import { getServerSession } from "@/lib/auth/session";

export { getSafeNextPath };

export async function handleAuthenticatedRedirect(
  requestUrl: URL,
  next: string,
): Promise<NextResponse> {
  const session = await getServerSession();
  const user = session?.user;

  if (
    user &&
    !isUserEmailVerified({
      email_confirmed_at: user.emailVerified ? new Date().toISOString() : null,
    })
  ) {
    return NextResponse.redirect(
      new URL(
        getEmailVerificationRedirectPath(user.email, {
          resend: VERIFICATION_RESEND_SOURCE.GATE,
        }),
        requestUrl,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

export function createErrorRedirect(requestUrl: URL, errorMessage: string): NextResponse {
  const errorUrl = new URL("/auth/error", requestUrl.origin);
  errorUrl.searchParams.set("error", errorMessage);
  return NextResponse.redirect(errorUrl);
}
