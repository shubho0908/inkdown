import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  PLATFORM_METRICS_CACHE_TAG,
  PLATFORM_METRICS_REVALIDATE_SECONDS,
} from "@/lib/platform-metrics/constants";
import { recomputePlatformMetricsFromDatabase } from "@/lib/platform-metrics/recompute";
import { platformMetricsResponseSchema } from "@/lib/validation/responses";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metrics = await recomputePlatformMetricsFromDatabase();
    revalidateTag(PLATFORM_METRICS_CACHE_TAG, "max");

    const payload = platformMetricsResponseSchema.parse(metrics);

    return NextResponse.json(
      {
        success: true,
        metrics: payload,
        revalidate_seconds: PLATFORM_METRICS_REVALIDATE_SECONDS,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to recompute platform metrics",
      },
      { status: 500 },
    );
  }
}
