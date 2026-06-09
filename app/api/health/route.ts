import { db, isDatabaseConfigured } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { isR2Configured } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error" | "not_configured"> = {
    database: "not_configured",
    storage: isR2Configured() ? "ok" : "not_configured",
  };

  if (isDatabaseConfigured()) {
    try {
      await db.select({ userId: profiles.userId }).from(profiles).limit(1);
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
  }

  const healthy = checks.database === "ok";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "inkdown",
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}
