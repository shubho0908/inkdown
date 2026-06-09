import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { rateLimit } from "@/lib/db/schema";

import type { RateLimitResult } from "@/lib/rate-limit/consume";
import type { RateLimitPolicy } from "@/lib/rate-limit/policies";

function retryAfterSec(lastRequest: number, windowMs: number, now: number) {
  return Math.max(1, Math.ceil((lastRequest + windowMs - now) / 1000));
}

/** Read-only check — does not increment the counter. */
export async function peekRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const now = Date.now();
  const { windowMs, max } = policy;

  const [existing] = await db.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);

  if (!existing) {
    return { allowed: true };
  }

  const lastRequest = Number(existing.lastRequest);

  if (now - lastRequest > windowMs) {
    return { allowed: true };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSec: retryAfterSec(lastRequest, windowMs, now),
    };
  }

  return { allowed: true };
}
