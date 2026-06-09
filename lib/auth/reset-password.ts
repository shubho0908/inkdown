export const RESET_PASSWORD_QUERY = {
  TOKEN: "token",
  ERROR: "error",
} as const;

const RESET_PASSWORD_ERRORS = {
  INVALID_TOKEN: "INVALID_TOKEN",
} as const;

export function getResetPasswordLinkError(
  token: string | null,
  error: string | null,
): string | null {
  if (token) {
    return null;
  }

  if (error === RESET_PASSWORD_ERRORS.INVALID_TOKEN) {
    return "This reset link has expired or is invalid. Please request a new password reset link.";
  }

  return "Invalid or missing reset token. Please request a new password reset link.";
}
