import { getCachedPlatformMetrics } from "@/lib/platform-metrics/cached";

const numberFormat = new Intl.NumberFormat("en-US", { notation: "compact" });

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
    <section aria-label="Platform metrics" className="border-y bg-muted/20 pt-0 pb-12 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Built for writers, developers, and teams
        </h2>
        <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {items.map(({ key, label, value }) => (
            <div key={key} className="text-center">
              <dt className="sr-only">{label}</dt>
              <dd className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {numberFormat.format(value)}
              </dd>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
