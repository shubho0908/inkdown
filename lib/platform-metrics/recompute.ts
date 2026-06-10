import "server-only";

import { and, count, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { files, folders, user } from "@/lib/db/schema";
import { upsertPlatformMetricsSnapshot } from "@/lib/platform-metrics/store";
import type { PlatformMetrics } from "@/lib/platform-metrics/types";

/**
 * Expensive aggregation — invoked only by cron reconciliation and db bootstrap.
 * Never call this from user-facing request paths.
 */
export async function recomputePlatformMetricsFromDatabase(): Promise<PlatformMetrics> {
  const [totalUsersResult, totalDocumentsResult, totalFoldersResult, publicDocumentsResult] =
    await Promise.all([
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(files),
      db.select({ value: count() }).from(folders),
      db
        .select({ value: count() })
        .from(files)
        .where(and(eq(files.isPublic, true), isNotNull(files.slug))),
    ]);

  const metrics: PlatformMetrics = {
    total_users: totalUsersResult[0]?.value ?? 0,
    total_documents: totalDocumentsResult[0]?.value ?? 0,
    total_folders: totalFoldersResult[0]?.value ?? 0,
    public_documents: publicDocumentsResult[0]?.value ?? 0,
    is_ready: true,
    computed_at: new Date().toISOString(),
  };

  await upsertPlatformMetricsSnapshot(metrics);

  return metrics;
}
