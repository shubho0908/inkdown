import { FileText, Globe, Users } from "lucide-react";

import { getCachedPlatformMetrics } from "@/lib/platform-metrics/cached";
import { formatMetricValue } from "@/lib/platform-metrics/format";

const metricCards = [
  {
    key: "total_users" as const,
    label: "Total writers",
    icon: Users,
  },
  {
    key: "total_documents" as const,
    label: "Documents created",
    icon: FileText,
  },
  {
    key: "public_documents" as const,
    label: "Published publicly",
    icon: Globe,
  },
];

export async function LandingPageMetrics() {
  const metrics = await getCachedPlatformMetrics();

  if (!metrics.is_ready) {
    return null;
  }

  return (
    <section
      aria-label="Platform usage"
      className="relative border-y border-border/60 bg-muted/20 py-14 sm:py-16"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by writers everywhere
        </p>

        <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {metricCards.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-xl border border-border/60 bg-background/70 px-4 py-5 text-center shadow-sm backdrop-blur-sm sm:px-5 sm:py-6"
            >
              <dt className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {label}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {formatMetricValue(metrics[key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
