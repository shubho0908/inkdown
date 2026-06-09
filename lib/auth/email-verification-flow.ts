import { getSiteUrl } from "@/lib/site-url";

export const EMAIL_VERIFICATION_REASON = "verify-email" as const;

/** Canonical verification gate route — all redirects must use getEmailVerificationRedirectPath(). */
export const EMAIL_VERIFICATION_GATE_PATH = "/auth/verify-email" as const;

/** Legacy signup success URL; kept only for permanent redirects to the gate. */
export const LEGACY_SIGN_UP_SUCCESS_PATH = "/auth/sign-up-success" as const;

/**
 * Controls verification-gate server resend behavior.
 *
 * Verification emails are only sent from the gate (server action), never from
 * swallowed Better Auth background tasks. All sign-in/sign-up redirects must
 * use GATE so delivery errors surface synchronously on the gate page.
 */
export const VERIFICATION_RESEND_SOURCE = {
  /** Server sends (or re-sends) the verification email on gate load. */
  GATE: "gate",
  /** PRG target after a successful gate resend. */
  GATE_SENT: "gate-sent",
} as const;

export type VerificationResendSource =
  (typeof VERIFICATION_RESEND_SOURCE)[keyof typeof VERIFICATION_RESEND_SOURCE];

/** Legacy query values kept so old bookmarks still trigger a server resend. */
const LEGACY_SERVER_RESEND_SOURCES = new Set(["login", "signup"]);

const POST_VERIFICATION_PATH = "/workspace";

export function getPostVerificationCallbackUrl(origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : getSiteUrl());

  return `${base}${POST_VERIFICATION_PATH}`;
}

export function getEmailVerificationRedirectPath(
  email?: string | null,
  options?: { resend?: VerificationResendSource },
) {
  const searchParams = new URLSearchParams({
    reason: EMAIL_VERIFICATION_REASON,
  });

  if (email) {
    searchParams.set("email", email);
  }

  if (options?.resend) {
    searchParams.set("resend", options.resend);
  }

  return `${EMAIL_VERIFICATION_GATE_PATH}?${searchParams.toString()}`;
}

export function getLegacySignUpSuccessRedirectPath(
  searchParams: URLSearchParams | Record<string, string | undefined>,
) {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(
          Object.entries(searchParams).flatMap(([key, value]) => (value ? [[key, value]] : [])),
        );

  const query = params.toString();
  return query
    ? `${EMAIL_VERIFICATION_GATE_PATH}?${query}`
    : `${EMAIL_VERIFICATION_GATE_PATH}?reason=${EMAIL_VERIFICATION_REASON}`;
}

type AuthClientError = {
  code?: string;
  message?: string;
  status?: number;
};

export function isEmailNotVerifiedAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as AuthClientError;

  if (authError.code === "EMAIL_NOT_VERIFIED") {
    return true;
  }

  if (authError.status === 403) {
    const message = authError.message?.toLowerCase() ?? "";
    return (
      message.includes("email not verified") ||
      message.includes("email not confirmed") ||
      message.includes("confirm your email")
    );
  }

  return false;
}

export function verificationGateNeedsServerResend(resend?: string | null) {
  if (!resend) {
    return false;
  }

  if (resend === VERIFICATION_RESEND_SOURCE.GATE) {
    return true;
  }

  return LEGACY_SERVER_RESEND_SOURCES.has(resend);
}

export type VerificationGateCopy = {
  title: string;
  description: string;
  body: string;
  footer?: string;
};

export function getVerificationGateCopy(resend?: string | null): VerificationGateCopy {
  if (resend === VERIFICATION_RESEND_SOURCE.GATE_SENT) {
    return {
      title: "Verify your email to continue",
      description: "Your email is not verified yet",
      body: "Sign-in stays blocked until you confirm your email address. We just sent you a fresh verification link.",
      footer:
        "A fresh verification link is on the way. Click it to confirm your email — you'll be signed in automatically.",
    };
  }

  if (verificationGateNeedsServerResend(resend)) {
    return {
      title: "Verify your email to continue",
      description: "Your email is not verified yet",
      body: "We are sending a verification link to your inbox. If it does not arrive, wait a few minutes before trying again from sign-in.",
    };
  }

  return {
    title: "Check your email",
    description: "Confirm your account to get started",
    body: "Click the link in your email to confirm your account and start using Inkdown.",
  };
}
