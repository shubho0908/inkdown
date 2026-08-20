import { getCachedPlatformMetrics } from "@/lib/platform-metrics/cached";
import { AnimatedNumber } from "@/components/animated-number";

export async function LandingPageMetrics() {
  const metrics = await getCachedPlatformMetrics();

  if (!metrics.is_ready) {
    return null;
  }

  const items = [
    { key: "total_users", label: "Writers", value: metrics.total_users },
    { key: "total_documents", label: "Documents", value: metrics.total_documents },
    { key: "total_folders", label: "Folders", value: metrics.total_folders },
  ] as const;

  return (
    <section aria-label="Platform metrics" className="mt-24 border-y bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Built for writers, developers, and teams
        </h2>
        <dl className="mt-8 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-8">
          {items.map(({ key, label, value }) => (
            <div key={key} className="flex flex-col-reverse text-center">
              <dt className="mt-2 text-[0.7rem] font-medium text-muted-foreground sm:text-sm">
                {label}
              </dt>
              <dd className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                <AnimatedNumber value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
