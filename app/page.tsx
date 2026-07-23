import { InkdownLogo } from "@/components/inkdown-logo";
import { JsonLd } from "@/components/json-ld";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-url";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing-page-content";
import { requireVerifiedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const authState = await requireVerifiedUser();

  if (authState.kind === "authenticated") {
    redirect("/workspace");
  }
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Inkdown",
        url: siteUrl,
        description:
          "A self-hosted markdown editor and workspace for writing, organizing, and sharing documents with live preview.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Inkdown",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        url: siteUrl,
        description:
          "A self-hosted markdown workspace with live preview, folder organization, and public publishing.",
      },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd id="home-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          <Link href="/" aria-label="Inkdown home" className="shrink-0">
            <InkdownLogo size="md" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:inline-flex"
            >
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <LandingPageContent />
      </main>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <InkdownLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Inkdown - the self-hosted markdown workspace for focused writing.
            </p>
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-end"
            >
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span aria-hidden="true" className="text-border">
                •
              </span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
