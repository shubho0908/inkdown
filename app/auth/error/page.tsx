import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Error",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params?.error ?? "An unexpected error occurred during authentication.";
  const isPkceStorageError = errorMessage
    .toLowerCase()
    .includes("pkce code verifier not found in storage");

  return (
    <AuthShell title="Something went wrong" description="Authentication could not be completed">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-7 text-destructive" />
        </div>
        <p className="break-words text-center text-sm text-muted-foreground">
          Error: {errorMessage}
        </p>
        {isPkceStorageError ? (
          <p className="text-center text-sm text-muted-foreground">
            This usually means the confirmation link opened in a different browser context than the
            one that started the auth flow. Update your email template to use the server
            confirmation route with a token_hash instead of the default PKCE callback URL.
          </p>
        ) : null}
        <Button asChild className="w-full">
          <Link href="/auth/login">Try again</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
