import { AUTH_EMAIL_LOGO_PATH } from "@/lib/email/constants";
import { getSiteUrl } from "@/lib/site-url";

/** Browser preview URL for the email logo (same-origin in dev). */
export function getAuthEmailLogoPreviewUrl(): string {
  return `${getSiteUrl()}${AUTH_EMAIL_LOGO_PATH}`;
}
