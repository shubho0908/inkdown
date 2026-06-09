"use client";

import {
  getEmailVerificationRedirectPath,
  getPostVerificationCallbackUrl,
  isEmailNotVerifiedAuthError,
  VERIFICATION_RESEND_SOURCE,
} from "@/lib/auth/email-verification-flow";
import { authClient } from "@/lib/auth/client";
import { normalizeAuthClientError } from "@/lib/auth/normalize-auth-client-error";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";
import { parseValue } from "@/lib/validation/parse";
import { signInBodySchema } from "@/lib/validation/requests";
import { useClientSearchParams } from "@/hooks/use-client-search-params";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { useState, useTransition } from "react";

export function LoginForm() {
  const searchParams = useClientSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const parsed = parseValue(signInBodySchema, { email, password });
      if (!parsed.success) {
        setError(parsed.error);
        return;
      }

      try {
        const { error: signInError } = await authClient.signIn.email({
          email: parsed.data.email,
          password: parsed.data.password,
          callbackURL: getPostVerificationCallbackUrl(),
        });

        if (signInError) {
          if (isEmailNotVerifiedAuthError(signInError)) {
            window.location.replace(
              getEmailVerificationRedirectPath(parsed.data.email, {
                resend: VERIFICATION_RESEND_SOURCE.GATE,
              }),
            );
            return;
          }

          throw new Error(normalizeAuthClientError(signInError, "sign-in"));
        }

        window.location.replace(getSafeNextPath(searchParams.get("next")));
      } catch (loginError: unknown) {
        setError(loginError instanceof Error ? loginError.message : "An error occurred");
      }
    });
  };

  return (
    <AuthShell title="Welcome back" description="Sign in to your Inkdown workspace">
      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoComplete="current-password"
            />
          </div>
          {error ? <AuthErrorAlert message={error} /> : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/auth/forgot-password"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
