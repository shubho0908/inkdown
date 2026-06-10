import "server-only";

import { after } from "next/server";

import { PLATFORM_METRICS_REVALIDATE_SECONDS } from "@/lib/platform-metrics/constants";
import {
  applyPlatformMetricDeltas,
  type PlatformMetricDeltas,
} from "@/lib/platform-metrics/counters";

function scheduleMetricDeltas(deltas: PlatformMetricDeltas) {
  after(async () => {
    try {
      await applyPlatformMetricDeltas(deltas);
    } catch {
      // Cron reconciliation heals drift; never fail the user request.
    }
  });
}

export function recordUserCreated() {
  scheduleMetricDeltas({ total_users: 1 });
}

export function recordDocumentCreated(count = 1) {
  scheduleMetricDeltas({ total_documents: count });
}

export function recordDocumentDeleted(count = 1, publicCount = 0) {
  const deltas: PlatformMetricDeltas = { total_documents: -count };

  if (publicCount > 0) {
    deltas.public_documents = -publicCount;
  }

  scheduleMetricDeltas(deltas);
}

export function recordFolderCreated(count = 1) {
  scheduleMetricDeltas({ total_folders: count });
}

export function recordFolderDeleted(documentCount: number, folderCount: number, publicCount = 0) {
  const deltas: PlatformMetricDeltas = {
    total_documents: -documentCount,
    total_folders: -folderCount,
  };

  if (publicCount > 0) {
    deltas.public_documents = -publicCount;
  }

  scheduleMetricDeltas(deltas);
}

export function recordPublicDocumentVisibilityChanged(isNowPublic: boolean) {
  scheduleMetricDeltas({ public_documents: isNowPublic ? 1 : -1 });
}

export function getPlatformMetricsCacheControlHeader() {
  return `public, s-maxage=${PLATFORM_METRICS_REVALIDATE_SECONDS}, stale-while-revalidate=86400`;
}
