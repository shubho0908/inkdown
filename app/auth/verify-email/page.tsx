import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VerificationGateContent } from "@/components/auth/verification-gate-content";
import {
  EMAIL_VERIFICATION_REASON,
  getEmailVerificationRedirectPath,
  getVerificationGateCopy,
  VERIFICATION_RESEND_SOURCE,
  verificationGateNeedsServerResend,
} from "@/lib/auth/email-verification-flow";
import { sendVerificationEmailFromServer } from "@/lib/auth/send-verification-email-server";

export const metadata: Metadata = {
  title: "Verify Your Email",
  description: "Confirm your Inkdown account email address to continue.",
  robots: { index: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    reason?: string;
    resend?: string;
  }>;
}) {
  const params = await searchParams;
  const isVerificationGate = params.reason === EMAIL_VERIFICATION_REASON;
  const copy = getVerificationGateCopy(isVerificationGate ? params.resend : undefined);

  if (verificationGateNeedsServerResend(params.resend) && params.email) {
    const result = await sendVerificationEmailFromServer(params.email);

    if (result.ok) {
      redirect(
        getEmailVerificationRedirectPath(params.email, {
          resend: VERIFICATION_RESEND_SOURCE.GATE_SENT,
        }),
      );
    }

    return (
      <VerificationGateContent email={params.email} copy={copy} resendError={result.message} />
    );
  }

  return <VerificationGateContent email={params.email} copy={copy} />;
}
