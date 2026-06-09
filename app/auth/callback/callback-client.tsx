"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { useClientSearchParams } from "@/hooks/use-client-search-params";
import Link from "next/link";
import { Suspense, useEffect } from "react";

function AuthCallbackClientInner() {
  const searchParams = useClientSearchParams();

  useEffect(() => {
    const next = getSafeNextPath(searchParams.get("next"));
    window.location.replace(next);
  }, [searchParams]);

  return (
    <AuthShell title="Finishing sign in" description="Redirecting to your workspace">
      <div className="flex justify-center py-8">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/workspace">Continue to workspace</Link>
      </Button>
    </AuthShell>
  );
}

export function AuthCallbackClient() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Finishing sign in" description="Finishing authentication...">
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </AuthShell>
      }
    >
      <AuthCallbackClientInner />
    </Suspense>
  );
}
