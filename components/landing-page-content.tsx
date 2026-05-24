import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LandingPageShowcase } from "@/components/landing-page-showcase";

export function LandingPageContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-background pt-12 pb-16 sm:pt-24 sm:pb-24 lg:pt-28 lg:pb-28">
        <div className="inkdown-noise pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,var(--background),transparent)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-[50rem] text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.25rem] lg:leading-[1.05]">
              Write beautiful markdown, <br className="hidden sm:block" />
              <span className="text-muted-foreground">share it instantly</span>
            </h1>

            <div className="mt-6 inline-flex items-center rounded-full border border-border/50 bg-background/70 py-1.5 px-4 text-xs font-medium text-foreground/70 shadow-sm">
              <span className="mr-2.5 flex size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              Inkdown 1.0 is now live
            </div>

            <p className="mx-auto mt-6 max-w-2xl px-2 text-pretty text-base leading-relaxed tracking-wide text-muted-foreground sm:mt-8 sm:px-0 sm:text-lg md:text-xl">
              The premium, distraction-free environment for thinkers. Organize seamlessly, preview
              fluidly, and publish with uncompromising elegance.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start drafting
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <LandingPageShowcase />
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border bg-muted/10 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-medium tracking-tight text-foreground sm:text-5xl lg:text-5xl">
            Clarity awaits.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl px-2 text-base leading-relaxed tracking-wide text-muted-foreground sm:px-0 sm:text-lg">
            Experience a genuinely refined markdown environment. Write, organize, and share with a
            workspace that profoundly respects your focus.
          </p>
          <Link
            href="/auth/sign-up"
            className="group mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-10"
          >
            Start writing seamlessly
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
