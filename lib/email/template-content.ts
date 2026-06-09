import { AUTH_EMAIL_LINK_EXPIRES_IN, AUTH_EMAIL_SUPPORT_ADDRESS } from "@/lib/email/constants";
import { getSiteUrl } from "@/lib/site-url";

export type AuthEmailTemplateType = "confirmation" | "welcome" | "password-reset";

export type AuthEmailTemplateContent = {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  finePrint: string;
  buttonText: string;
  buttonUrl: string;
};

type AuthEmailTemplateInput = {
  type: AuthEmailTemplateType;
  userName?: string;
  confirmationUrl?: string;
  resetUrl?: string;
};

export function getAuthEmailTemplateContent(
  input: AuthEmailTemplateInput,
): AuthEmailTemplateContent {
  const baseUrl = getSiteUrl();
  const expiryCopy = `This link expires in ${AUTH_EMAIL_LINK_EXPIRES_IN}.`;

  const templates: Record<AuthEmailTemplateType, AuthEmailTemplateContent> = {
    confirmation: {
      subject: "Verify your Inkdown email",
      preheader: "Confirm your email to start writing and sharing markdown.",
      heading: "Confirm your email",
      body: "Thanks for signing up for Inkdown. Confirm your email address to start creating and sharing beautiful markdown documents. You will be signed in automatically after you verify.",
      finePrint: `${expiryCopy} If you did not create an Inkdown account, you can safely ignore this email.`,
      buttonText: "Confirm Email",
      buttonUrl: input.confirmationUrl ?? "#",
    },
    welcome: {
      subject: "Welcome to Inkdown",
      preheader: "Your account is ready. Start writing beautiful markdown.",
      heading: `Welcome to Inkdown, ${input.userName ?? "there"}!`,
      body: "Your account has been confirmed and you are all set to start writing. Create your first document and experience organized markdown.",
      finePrint: "If you did not create this account, please contact support.",
      buttonText: "Open Inkdown",
      buttonUrl: `${baseUrl}/`,
    },
    "password-reset": {
      subject: "Reset your Inkdown password",
      preheader: "Use the secure link below to choose a new password.",
      heading: "Reset your password",
      body: "We received a request to reset your Inkdown password. Click the button below to choose a new password.",
      finePrint: `${expiryCopy} If you did not request a password reset, you can safely ignore this email. Your password will not change.`,
      buttonText: "Reset Password",
      buttonUrl: input.resetUrl ?? "#",
    },
  };

  return templates[input.type];
}

export function buildAuthEmailPlainText(content: AuthEmailTemplateContent): string {
  return [
    content.heading,
    "",
    content.body,
    "",
    `${content.buttonText}: ${content.buttonUrl}`,
    "",
    content.finePrint,
    "",
    "—",
    "Inkdown",
    `Questions? ${AUTH_EMAIL_SUPPORT_ADDRESS}`,
  ].join("\n");
}
