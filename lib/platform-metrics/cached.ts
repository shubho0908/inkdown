import "server-only";

import { unstable_cache } from "next/cache";

import {
  PLATFORM_METRICS_CACHE_TAG,
  PLATFORM_METRICS_REVALIDATE_SECONDS,
} from "@/lib/platform-metrics/constants";
import { readPlatformMetricsSnapshot } from "@/lib/platform-metrics/store";
import type { PlatformMetrics } from "@/lib/platform-metrics/types";

const getCachedSnapshot = unstable_cache(
  async (): Promise<PlatformMetrics> => readPlatformMetricsSnapshot(),
  [PLATFORM_METRICS_CACHE_TAG],
  {
    revalidate: PLATFORM_METRICS_REVALIDATE_SECONDS,
    tags: [PLATFORM_METRICS_CACHE_TAG],
  },
);

/**
 * Landing-page and public API entry point.
 * Serves from Next.js Data Cache; at most one O(1) snapshot read every 3 days per region.
 */
export async function getCachedPlatformMetrics(): Promise<PlatformMetrics> {
  return getCachedSnapshot();
}
