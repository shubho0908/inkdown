import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getLegacySignUpSuccessRedirectPath } from "@/lib/auth/email-verification-flow";

export const metadata: Metadata = {
  title: "Check Your Email",
  description: "We sent you a confirmation link to verify your Inkdown account.",
  robots: { index: false },
};

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  redirect(getLegacySignUpSuccessRedirectPath(params));
}
