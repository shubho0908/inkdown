import * as React from "react";

import { getAuthEmailLogoPreviewUrl } from "@/lib/email/asset-url";
import { AUTH_EMAIL_SUPPORT_ADDRESS } from "@/lib/email/constants";
import {
  getAuthEmailTemplateContent,
  type AuthEmailTemplateType,
} from "@/lib/email/template-content";
import { emailTemplateStyles as styles } from "@/lib/email/template-styles";

export type AuthEmailTemplateProps = {
  type: AuthEmailTemplateType;
  userName?: string;
  confirmationUrl?: string;
  resetUrl?: string;
  /** Defaults to same-origin preview URL; production sends use cid:inkdown-logo. */
  logoSrc?: string;
};

const PREHEADER_STYLE = {
  display: "none",
  maxHeight: 0,
  overflow: "hidden",
  opacity: 0,
  msoHide: "all",
} as React.CSSProperties;

export function AuthEmailTemplate({
  type,
  userName,
  confirmationUrl,
  resetUrl,
  logoSrc = getAuthEmailLogoPreviewUrl(),
}: AuthEmailTemplateProps) {
  const content = getAuthEmailTemplateContent({
    type,
    userName,
    confirmationUrl,
    resetUrl,
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>{content.subject}</title>
      </head>
      <body style={styles.body}>
        <div style={PREHEADER_STYLE}>{content.preheader}</div>
        <table role="presentation" style={styles.container} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={styles.wrapper}>
                <table role="presentation" style={styles.header} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={styles.logoCell}>
                        <img
                          src={logoSrc}
                          alt="Inkdown"
                          width={48}
                          height={48}
                          style={styles.logo}
                        />
                        <span style={styles.logoText}>Inkdown</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table role="presentation" style={styles.content} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={styles.contentCell}>
                        <h1 style={styles.heading}>{content.heading}</h1>
                        <p style={styles.paragraph}>{content.body}</p>
                        <p style={styles.finePrint}>{content.finePrint}</p>

                        <table
                          role="presentation"
                          cellPadding="0"
                          cellSpacing="0"
                          style={styles.buttonContainer}
                        >
                          <tbody>
                            <tr>
                              <td style={styles.buttonCell}>
                                <a href={content.buttonUrl} style={styles.button}>
                                  {content.buttonText}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={styles.altLink}>
                          Or copy and paste this URL into your browser:
                          <br />
                          <a href={content.buttonUrl} style={styles.link}>
                            {content.buttonUrl}
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table role="presentation" style={styles.footer} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={styles.footerCell}>
                        <p style={styles.footerText}>
                          This email was sent by Inkdown. If you have questions, contact us at{" "}
                          <a
                            href={`mailto:${AUTH_EMAIL_SUPPORT_ADDRESS}`}
                            style={styles.footerLink}
                          >
                            {AUTH_EMAIL_SUPPORT_ADDRESS}
                          </a>
                          .
                        </p>
                        <p style={styles.footerMuted}>
                          Inkdown: your markdown, beautifully organized.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
