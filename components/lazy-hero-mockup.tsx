"use client";

import { Suspense, lazy } from "react";
import { useMediaQuery } from "@/components/use-media-query";

const LandingPageHeroMockup = lazy(() =>
  import("@/components/landing-page-hero-mockup").then((m) => ({
    default: m.LandingPageHeroMockup,
  })),
);

function HeroMockupSkeleton() {
  return <div className="aspect-[4/3] w-full rounded-xl border bg-muted/20" />;
}

export function LazyHeroMockup() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!isDesktop) {
    return <HeroMockupSkeleton />;
  }

  return (
    <Suspense fallback={<HeroMockupSkeleton />}>
      <LandingPageHeroMockup />
    </Suspense>
  );
}
