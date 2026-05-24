import { InkdownLogo } from "@/components/inkdown-logo";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing-page-content";
import { requireVerifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const authState = await requireVerifiedUser(supabase);

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
          "Create, organize, and share beautiful markdown documents with live preview and instant sharing.",
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
          "A markdown editor and sharing platform with live preview, folder organization, and public publishing.",
      },
    ],
  };

  return (
    <div className="flex min-h-svh flex-col">
      <JsonLd id="home-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <InkdownLogo size="md" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/auth/login"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="hidden h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <LandingPageContent />
      </main>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <InkdownLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Inkdown - Your markdown, beautifully organized.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-end">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span className="text-border">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
