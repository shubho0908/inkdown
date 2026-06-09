import "server-only";

import type { BetterAuthPlugin } from "better-auth";
import { normalizePathname } from "@better-auth/core/utils/url";

import {
  buildAuthEmailRateLimitResponse,
  getRecipientAuthEmailRateLimit,
  normalizeAuthEmailRecipient,
} from "@/lib/auth/auth-email-guard";

/** Better Auth paths that may trigger an auth email for the address in the JSON body. */
const RECIPIENT_GUARDED_PATHS = new Set(["/request-password-reset", "/send-verification-email"]);

function parseEmailFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("email" in body)) {
    return undefined;
  }

  const email = body.email;
  if (typeof email !== "string") {
    return undefined;
  }

  return normalizeAuthEmailRecipient(email);
}

export function authEmailGuardPlugin(): BetterAuthPlugin {
  return {
    id: "auth-email-guard",
    onRequest: async (request, ctx) => {
      if (request.method !== "POST") {
        return;
      }

      const basePath = new URL(ctx.baseURL).pathname;
      const path = normalizePathname(request.url, basePath);

      if (!RECIPIENT_GUARDED_PATHS.has(path)) {
        return;
      }

      let email: string | undefined;
      try {
        email = parseEmailFromBody(await request.clone().json());
      } catch {
        return;
      }

      if (!email) {
        return;
      }

      const limit = await getRecipientAuthEmailRateLimit(email);
      if (!limit.allowed) {
        return { response: buildAuthEmailRateLimitResponse(limit.retryAfterSec) };
      }
    },
  };
}
