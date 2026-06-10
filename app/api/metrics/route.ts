import { NextResponse } from "next/server";

import { getCachedPlatformMetrics } from "@/lib/platform-metrics/cached";
import { getPlatformMetricsCacheControlHeader } from "@/lib/platform-metrics/increment";
import { platformMetricsResponseSchema } from "@/lib/validation/responses";

export async function GET() {
  const metrics = await getCachedPlatformMetrics();
  const payload = platformMetricsResponseSchema.parse(metrics);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": getPlatformMetricsCacheControlHeader(),
    },
  });
}
