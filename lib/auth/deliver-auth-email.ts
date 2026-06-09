import "server-only";

import { sendAuthEmail, type AuthEmailPayload } from "@/lib/auth/email";

export type DeliverAuthEmailInput = {
  to: string;
  payload: AuthEmailPayload;
  idempotencyKey: string;
  tag: "verification" | "password-reset";
};

/** Single choke point for all Better Auth email callbacks (rate limit + Resend). */
export async function deliverAuthEmail(input: DeliverAuthEmailInput) {
  await sendAuthEmail({
    to: input.to,
    subject: input.payload.subject,
    templateProps: input.payload.templateProps,
    text: input.payload.text,
    idempotencyKey: input.idempotencyKey,
    tag: input.tag,
  });
}
