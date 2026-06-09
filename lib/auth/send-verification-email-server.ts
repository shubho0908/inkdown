import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/better-auth";
import { getPostVerificationCallbackUrl } from "@/lib/auth/email-verification-flow";
import { normalizeAuthClientError } from "@/lib/auth/normalize-auth-client-error";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { consumeRateLimit, rateLimitedMessage } from "@/lib/rate-limit/consume";
import { verificationGateResendIpKey } from "@/lib/rate-limit/keys";
import { VERIFICATION_GATE_RESEND_IP } from "@/lib/rate-limit/policies";

export type SendVerificationEmailResult = { ok: true } | { ok: false; message: string };

export async function sendVerificationEmailFromServer(
  email: string,
): Promise<SendVerificationEmailResult> {
  const ipLimit = await consumeRateLimit(
    verificationGateResendIpKey(getClientIp(await headers())),
    VERIFICATION_GATE_RESEND_IP,
  );

  if (!ipLimit.allowed) {
    return { ok: false, message: rateLimitedMessage(ipLimit.retryAfterSec) };
  }

  try {
    await auth.api.sendVerificationEmail({
      headers: await headers(),
      body: {
        email,
        callbackURL: getPostVerificationCallbackUrl(),
      },
    });

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? normalizeAuthClientError(
            { message: error.message, status: readErrorStatus(error) },
            "verification-email",
          )
        : normalizeAuthClientError(null, "verification-email");

    return { ok: false, message };
  }
}

function readErrorStatus(error: Error) {
  if (!("status" in error)) {
    return undefined;
  }

  const status = (error as Error & { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}
