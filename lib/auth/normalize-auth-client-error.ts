import {
  isRateLimitMessage,
  normalizeRateLimitErrorMessage,
  type AuthRateLimitAction,
} from "@/lib/rate-limit/messages";

type AuthClientErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

export function normalizeAuthClientError(
  error: AuthClientErrorLike | null | undefined,
  action: AuthRateLimitAction,
) {
  if (!error) {
    return normalizeRateLimitErrorMessage(null, action);
  }

  if (
    error.code === "RATE_LIMITED" ||
    error.status === 429 ||
    isRateLimitMessage(error.message ?? "")
  ) {
    return normalizeRateLimitErrorMessage(error, action);
  }

  return error.message?.trim() || "Something went wrong. Please try again.";
}
