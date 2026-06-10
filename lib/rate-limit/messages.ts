const RATE_LIMIT_PATTERN = /too many requests|rate limit/i;

export type AuthRateLimitAction =
  | "password-reset"
  | "verification-email"
  | "sign-in"
  | "sign-up"
  | "check-email";

export function isRateLimitMessage(message: string) {
  return RATE_LIMIT_PATTERN.test(message);
}

export function formatRateLimitMessage(retryAfterSec: number) {
  const minutes = Math.ceil(retryAfterSec / 60);

  if (minutes <= 1) {
    return "You've requested too many emails. Please wait about a minute before trying again.";
  }

  return `You've requested too many emails. Please wait about ${minutes} minutes before trying again.`;
}

function getAuthRateLimitMessage(action: AuthRateLimitAction) {
  switch (action) {
    case "password-reset":
      return "Too many password reset requests. Please wait about an hour before requesting another link.";
    case "verification-email":
      return "Too many verification emails requested. Please wait about an hour before requesting another.";
    case "sign-in":
      return "Too many sign-in attempts. Please wait a few minutes before trying again.";
    case "sign-up":
      return "Too many sign-up attempts. Please wait a few minutes before trying again.";
    case "check-email":
      return "Too many attempts to check this email. Please wait a minute before trying again.";
  }
}

type ErrorLike = {
  message?: string;
  status?: number;
  statusCode?: number;
  code?: string;
};

export function normalizeRateLimitErrorMessage(
  error: unknown,
  action?: AuthRateLimitAction,
): string {
  if (!error) {
    return action
      ? getAuthRateLimitMessage(action)
      : "You've made too many requests. Please wait a bit before trying again.";
  }

  const errorLike = error as ErrorLike;
  const message =
    error instanceof Error
      ? error.message
      : typeof errorLike.message === "string"
        ? errorLike.message
        : "";
  const status = errorLike.status ?? errorLike.statusCode;

  if (errorLike.code === "RATE_LIMITED" || status === 429 || isRateLimitMessage(message)) {
    if (message && /wait about/i.test(message)) {
      return message;
    }

    return action ? getAuthRateLimitMessage(action) : getDefaultRateLimitMessage(message);
  }

  return message || "Something went wrong. Please try again.";
}

function getDefaultRateLimitMessage(message: string) {
  if (message.trim()) {
    return message;
  }

  return "You've made too many requests. Please wait a bit before trying again.";
}
