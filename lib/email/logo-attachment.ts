import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const AUTH_EMAIL_LOGO_CID = "inkdown-logo" as const;

export function getAuthEmailLogoAttachment() {
  const logoPath = join(process.cwd(), "public", "email-logo.png");
  const content = readFileSync(logoPath);

  return {
    filename: "email-logo.png",
    content,
    contentId: AUTH_EMAIL_LOGO_CID,
  };
}

export function getAuthEmailLogoCidSrc(): string {
  return `cid:${AUTH_EMAIL_LOGO_CID}`;
}
