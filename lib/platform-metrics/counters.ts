import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { platformMetrics } from "@/lib/db/schema";
import { PLATFORM_METRICS_SNAPSHOT_ID } from "@/lib/platform-metrics/constants";

export type PlatformMetricCounter =
  | "total_users"
  | "total_documents"
  | "total_folders"
  | "public_documents";

export type PlatformMetricDeltas = Partial<Record<PlatformMetricCounter, number>>;

function applyDeltasToSnapshot(
  snapshot: typeof platformMetrics.$inferSelect,
  deltas: PlatformMetricDeltas,
) {
  const next = {
    totalUsers: snapshot.totalUsers,
    totalDocuments: snapshot.totalDocuments,
    totalFolders: snapshot.totalFolders,
    publicDocuments: snapshot.publicDocuments,
  };

  for (const [counter, delta] of Object.entries(deltas) as Array<
    [PlatformMetricCounter, number | undefined]
  >) {
    if (typeof delta !== "number" || delta === 0) {
      continue;
    }

    if (counter === "total_users") {
      next.totalUsers = Math.max(0, next.totalUsers + delta);
    } else if (counter === "total_documents") {
      next.totalDocuments = Math.max(0, next.totalDocuments + delta);
    } else if (counter === "total_folders") {
      next.totalFolders = Math.max(0, next.totalFolders + delta);
    } else if (counter === "public_documents") {
      next.publicDocuments = Math.max(0, next.publicDocuments + delta);
    }
  }

  return next;
}

/**
 * Race-safe single-row counter updates via SELECT … FOR UPDATE inside a transaction.
 * Pure Drizzle — no raw SQL in application code.
 */
export async function applyPlatformMetricDeltas(deltas: PlatformMetricDeltas) {
  const entries = Object.entries(deltas).filter(
    (entry): entry is [PlatformMetricCounter, number] =>
      typeof entry[1] === "number" && entry[1] !== 0,
  );

  if (entries.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(platformMetrics)
      .where(eq(platformMetrics.id, PLATFORM_METRICS_SNAPSHOT_ID))
      .for("update")
      .limit(1);

    const snapshot = rows[0];
    if (!snapshot) {
      return;
    }

    const next = applyDeltasToSnapshot(snapshot, Object.fromEntries(entries));

    await tx
      .update(platformMetrics)
      .set(next)
      .where(eq(platformMetrics.id, PLATFORM_METRICS_SNAPSHOT_ID));
  });
}
