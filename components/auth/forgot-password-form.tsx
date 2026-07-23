"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { authClient } from "@/lib/auth/client";
import { normalizeAuthClientError } from "@/lib/auth/normalize-auth-client-error";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import Link from "next/link";
import { useState, useTransition } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await authClient.requestPasswordReset({
          email: email.toLowerCase().trim(),
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          throw new Error(normalizeAuthClientError(error, "password-reset"));
        }

        setSuccess(true);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    });
  };

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        description={"We've sent a password reset link to your email"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            If an account with this email exists, you&apos;ll receive a password reset link shortly.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
          >
            Send another link
          </Button>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot password" description="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit}>
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
              className="focus-visible:ring-primary/50"
            />
          </div>
          {error ? <AuthErrorAlert message={error} /> : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending…" : "Send reset link"}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
