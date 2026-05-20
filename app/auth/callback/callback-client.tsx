"use client";

import { getEmailVerificationRedirectPath, isUserEmailVerified } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { ensureSessionPersistence } from "@/lib/supabase/persistence";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CallbackStatus =
  | { kind: "loading"; message: string }
  | { kind: "error"; message: string; detail?: string };

type SupportedEmailOtpType = "email" | "recovery" | "invite" | "email_change";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/workspace";
  }

  return next;
}

function isSupportedEmailOtpType(type: string | null): type is SupportedEmailOtpType {
  return type === "email" || type === "recovery" || type === "invite" || type === "email_change";
}

function getHashParams() {
  if (typeof window === "undefined" || window.location.hash.length <= 1) {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.slice(1));
}

function getAuthErrorMessage(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  return (
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error")
  );
}

export function AuthCallbackClient() {
  const readonlySearchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>({
    kind: "loading",
    message: "Finishing authentication...",
  });
  const searchParams = useMemo(
    () => new URLSearchParams(readonlySearchParams.toString()),
    [readonlySearchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const supabase = createClient();
      const hashParams = getHashParams();
      const errorMessage = getAuthErrorMessage(searchParams, hashParams);
      const next = getSafeNextPath(searchParams.get("next"));

      if (errorMessage) {
        setStatus({
          kind: "error",
          message: "Authentication failed.",
          detail: errorMessage,
        });
        return;
      }

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
        const type = searchParams.get("type") || hashParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (tokenHash && type === "recovery") {
          window.location.replace(
            `/auth/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`,
          );
          return;
        }

        if (code) {
          setStatus({
            kind: "loading",
            message: "Exchanging your secure sign-in code...",
          });
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (tokenHash && isSupportedEmailOtpType(type)) {
          setStatus({
            kind: "loading",
            message: "Verifying your email link...",
          });
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          setStatus({
            kind: "loading",
            message: "Restoring your authenticated session...",
          });
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else {
          throw new Error("Missing authentication code");
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw userError ?? new Error("Authentication succeeded but no user was returned");
        }

        if (!isUserEmailVerified(user)) {
          await supabase.auth.signOut();
          window.location.replace(getEmailVerificationRedirectPath(user.email));
          return;
        }

        await ensureSessionPersistence(supabase);

        if (!cancelled) {
          window.history.replaceState(null, "", "/auth/callback");
          window.location.replace(next);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const detail = error instanceof Error ? error.message : "Unexpected authentication error";

        setStatus({
          kind: "error",
          message: "Authentication failed.",
          detail,
        });
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status.kind === "error") {
    return (
      <AuthShell title="Authentication Error" description="We could not sign you in">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">{status.message}</p>
            {status.detail ? (
              <p className="mt-1 break-words text-xs text-muted-foreground">{status.detail}</p>
            ) : null}
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Finishing sign in" description={status.message}>
      <div className="flex justify-center py-8">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    </AuthShell>
  );
}
