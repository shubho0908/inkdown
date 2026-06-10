import "server-only";

import { authEmailRecipientKey } from "@/lib/rate-limit/keys";
import { formatRateLimitMessage } from "@/lib/rate-limit/messages";
import { AUTH_EMAIL_RECIPIENT } from "@/lib/rate-limit/policies";
import { peekRateLimit } from "@/lib/rate-limit/peek";

const AUTH_EMAIL_RATE_LIMIT_CODE = "RATE_LIMITED" as const;

export function normalizeAuthEmailRecipient(email: string) {
  return email.toLowerCase().trim();
}

export async function getRecipientAuthEmailRateLimit(email: string) {
  const recipient = normalizeAuthEmailRecipient(email);

  if (!recipient) {
    return { allowed: true as const };
  }

  return peekRateLimit(authEmailRecipientKey(recipient), AUTH_EMAIL_RECIPIENT);
}

export function buildAuthEmailRateLimitResponse(retryAfterSec: number) {
  const message = formatRateLimitMessage(retryAfterSec);

  return new Response(
    JSON.stringify({
      code: AUTH_EMAIL_RATE_LIMIT_CODE,
      message,
    }),
    {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
