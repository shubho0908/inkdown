import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { rateLimit } from "@/lib/db/schema";

import { formatRateLimitMessage } from "@/lib/rate-limit/messages";
import type { RateLimitPolicy } from "@/lib/rate-limit/policies";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSec: number };

function retryAfterSec(lastRequest: number, windowMs: number, now: number) {
  return Math.max(1, Math.ceil((lastRequest + windowMs - now) / 1000));
}

export async function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const now = Date.now();

  const [existing] = await db.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);

  if (!existing) {
    try {
      await db.insert(rateLimit).values({ id: randomUUID(), key, count: 1, lastRequest: now });
      return { allowed: true };
    } catch {
      const [raced] = await db.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);
      if (!raced) {
        return { allowed: true };
      }

      return consumeExisting(raced, policy, now);
    }
  }

  return consumeExisting(existing, policy, now);
}

async function consumeExisting(
  existing: { key: string; count: number; lastRequest: number },
  policy: RateLimitPolicy,
  now: number,
): Promise<RateLimitResult> {
  const { windowMs, max } = policy;
  const lastRequest = Number(existing.lastRequest);

  if (now - lastRequest > windowMs) {
    await db
      .update(rateLimit)
      .set({ count: 1, lastRequest: now })
      .where(eq(rateLimit.key, existing.key));
    return { allowed: true };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSec: retryAfterSec(lastRequest, windowMs, now),
    };
  }

  await db
    .update(rateLimit)
    .set({ count: existing.count + 1, lastRequest: now })
    .where(eq(rateLimit.key, existing.key));

  return { allowed: true };
}

export function rateLimitedMessage(retryAfterSec: number) {
  return formatRateLimitMessage(retryAfterSec);
}
