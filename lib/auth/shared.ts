export const AUTH_ERROR_MESSAGES = {
  unauthorized: "Unauthorized",
  emailNotVerified: "Please verify your email before signing in.",
} as const;

export type VerifiedUserResult =
  | { kind: "authenticated"; user: AuthUser }
  | { kind: "unauthenticated" }
  | { kind: "unverified"; user: AuthUser };

type AuthUser = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export function isUserEmailVerified(user: Partial<AuthUser> | null | undefined) {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}
