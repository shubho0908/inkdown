import "server-only";

import type { ReactElement } from "react";
import { Resend } from "resend";

import { AuthEmailTemplate, type AuthEmailTemplateProps } from "@/lib/email/auth-email-template";
import { getAuthEmailLogoAttachment, getAuthEmailLogoCidSrc } from "@/lib/email/logo-attachment";
import { buildAuthEmailPlainText, getAuthEmailTemplateContent } from "@/lib/email/template-content";
import { consumeRateLimit, rateLimitedMessage } from "@/lib/rate-limit/consume";
import { authEmailRecipientKey } from "@/lib/rate-limit/keys";
import { AUTH_EMAIL_RECIPIENT } from "@/lib/rate-limit/policies";

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

async function renderAuthEmailHtml(react: ReactElement): Promise<string> {
  const { render } = await import("@react-email/render");
  return render(react);
}

export type AuthEmailPayload = {
  subject: string;
  templateProps: AuthEmailTemplateProps;
  text: string;
};

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  templateProps: AuthEmailTemplateProps;
  text: string;
  idempotencyKey?: string;
  tag?: "verification" | "password-reset";
}) {
  const from = process.env.RESEND_FROM || "Inkdown <onboarding@resend.dev>";
  const recipientLimit = await consumeRateLimit(
    authEmailRecipientKey(input.to),
    AUTH_EMAIL_RECIPIENT,
  );

  if (!recipientLimit.allowed) {
    throw new Error(rateLimitedMessage(recipientLimit.retryAfterSec));
  }

  const client = getResendClient();

  if (!client) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth-email:dev]", {
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      return;
    }

    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM for auth emails.",
    );
  }

  const react = AuthEmailTemplate({
    ...input.templateProps,
    logoSrc: getAuthEmailLogoCidSrc(),
  });
  const html = await renderAuthEmailHtml(react);

  const { error } = await client.emails.send(
    {
      from,
      to: [input.to],
      subject: input.subject,
      html,
      text: input.text,
      attachments: [getAuthEmailLogoAttachment()],
      tags: input.tag ? [{ name: "type", value: input.tag }] : undefined,
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );

  if (error) {
    throw new Error(error.message);
  }
}

export function buildVerificationEmail(url: string): AuthEmailPayload {
  const templateProps = {
    type: "confirmation" as const,
    confirmationUrl: url,
  };
  const content = getAuthEmailTemplateContent(templateProps);

  return {
    subject: content.subject,
    templateProps,
    text: buildAuthEmailPlainText(content),
  };
}

export function buildResetPasswordEmail(url: string): AuthEmailPayload {
  const templateProps = {
    type: "password-reset" as const,
    resetUrl: url,
  };
  const content = getAuthEmailTemplateContent(templateProps);

  return {
    subject: content.subject,
    templateProps,
    text: buildAuthEmailPlainText(content),
  };
}
