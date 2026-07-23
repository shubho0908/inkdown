import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingPageHeroMockup } from "@/components/landing-page-hero-mockup";
import { LandingPageMetrics } from "@/components/landing-page-metrics";
import { LandingPageShowcase } from "@/components/landing-page-showcase";

export function LandingPageContent() {
  return (
    <main id="content">
      <section aria-label="Hero" className="relative overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 flex flex-col justify-center lg:order-1">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                A markdown editor built for clear, focused writing.
              </h1>
              <p className="mt-6 max-w-lg text-balance text-lg leading-relaxed text-muted-foreground">
                Inkdown is a self-hosted markdown workspace. Write with live preview, organize
                documents in folders, and share them with a public link. No clutter, no friction.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  <Link href="/auth/sign-up">Start writing</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <LandingPageHeroMockup />
            </div>
          </div>
        </div>
      </section>

      <LandingPageMetrics />
      <LandingPageShowcase />

      <section
        aria-label="Get started"
        className="relative overflow-hidden border-t bg-muted/30 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Ready to write more clearly?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Join a focused workspace built for markdown. Start writing for free in seconds.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Link href="/auth/sign-up">Create your free account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
