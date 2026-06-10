import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { platformMetrics } from "@/lib/db/schema";
import { PLATFORM_METRICS_SNAPSHOT_ID } from "@/lib/platform-metrics/constants";
import { UNINITIALIZED_PLATFORM_METRICS, type PlatformMetrics } from "@/lib/platform-metrics/types";

function toPlatformMetrics(row: typeof platformMetrics.$inferSelect): PlatformMetrics {
  return {
    total_users: row.totalUsers,
    total_documents: row.totalDocuments,
    total_folders: row.totalFolders,
    public_documents: row.publicDocuments,
    is_ready: row.isReady,
    computed_at: row.computedAt.toISOString(),
  };
}

/** O(1) primary-key read — the only DB access allowed on the metrics hot path. */
export async function readPlatformMetricsSnapshot(): Promise<PlatformMetrics> {
  const rows = await db
    .select()
    .from(platformMetrics)
    .where(eq(platformMetrics.id, PLATFORM_METRICS_SNAPSHOT_ID))
    .limit(1);

  const row = rows[0];
  return row ? toPlatformMetrics(row) : UNINITIALIZED_PLATFORM_METRICS;
}

export async function upsertPlatformMetricsSnapshot(metrics: PlatformMetrics) {
  const computedAt = new Date(metrics.computed_at);

  await db
    .insert(platformMetrics)
    .values({
      id: PLATFORM_METRICS_SNAPSHOT_ID,
      totalUsers: metrics.total_users,
      totalDocuments: metrics.total_documents,
      totalFolders: metrics.total_folders,
      publicDocuments: metrics.public_documents,
      isReady: metrics.is_ready,
      computedAt,
    })
    .onConflictDoUpdate({
      target: platformMetrics.id,
      set: {
        totalUsers: metrics.total_users,
        totalDocuments: metrics.total_documents,
        totalFolders: metrics.total_folders,
        publicDocuments: metrics.public_documents,
        isReady: metrics.is_ready,
        computedAt,
      },
    });
}
