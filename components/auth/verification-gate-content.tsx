import { AuthShell } from "@/components/auth/auth-shell";
import { AuthErrorAlert } from "@/components/auth/auth-error-alert";
import { CheckCircle2 } from "lucide-react";
import type { VerificationGateCopy } from "@/lib/auth/email-verification-flow";

type VerificationGateContentProps = {
  email?: string | null;
  copy: VerificationGateCopy;
  resendError?: string | null;
};

export function VerificationGateContent({
  email,
  copy,
  resendError,
}: VerificationGateContentProps) {
  return (
    <AuthShell title={copy.title} description={copy.description}>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-3 text-left">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
          </div>
        </div>

        {email ? (
          <p className="text-center text-sm text-muted-foreground">
            Sent to: <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : null}

        {resendError ? (
          <AuthErrorAlert title="Could not send verification email" message={resendError} />
        ) : copy.footer ? (
          <p className="text-center text-sm text-muted-foreground">{copy.footer}</p>
        ) : null}
      </div>
    </AuthShell>
  );
}
