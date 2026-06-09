import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import {
  getEmailVerificationRedirectPath,
  VERIFICATION_RESEND_SOURCE,
} from "@/lib/auth/email-verification-flow";
import { requireVerifiedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Inkdown account to access your markdown workspace.",
  robots: { index: false },
};

export default async function LoginPage() {
  const authState = await requireVerifiedUser();

  if (authState.kind === "authenticated") {
    redirect("/workspace");
  }

  if (authState.kind === "unverified") {
    redirect(
      getEmailVerificationRedirectPath(authState.user.email, {
        resend: VERIFICATION_RESEND_SOURCE.GATE,
      }),
    );
  }

  return <LoginForm />;
}
