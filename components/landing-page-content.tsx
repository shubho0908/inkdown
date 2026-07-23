import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LazyHeroMockup } from "@/components/lazy-hero-mockup";
import { AnimatedSection } from "@/components/animated-section";
import { LandingPageMetrics } from "@/components/landing-page-metrics";
import { LandingPageShowcase } from "@/components/landing-page-showcase";

export function LandingPageContent() {
  return (
    <main id="content">
      <AnimatedSection aria-label="Hero" className="relative overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="mt-8 grid items-center gap-10 pt-20 pb-24 sm:pt-24 sm:pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-24 lg:pb-24">
            <div className="order-1 flex min-w-0 flex-col justify-center">
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-5xl lg:text-5xl xl:text-6xl">
                A markdown editor built for clear, focused writing.
              </h1>
              <p className="mt-5 max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
                Inkdown is a self-hosted markdown workspace. Write with live preview, organize
                documents in folders, and share them with a public link. No clutter, no friction.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-700 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <Link href="/auth/sign-up">Start writing</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="order-2 hidden min-w-0 lg:block">
              <LazyHeroMockup />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <LandingPageMetrics />
      <LandingPageShowcase />

      <AnimatedSection
        aria-label="Get started"
        className="relative mt-24 overflow-hidden border-t bg-muted/30 py-24 sm:py-28 lg:py-28"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Ready to write more clearly?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Join a focused workspace built for markdown. Start writing for free in seconds.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-indigo-700 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              <Link href="/auth/sign-up">Create your free account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
