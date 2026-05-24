import * as React from "react";
import { emailTemplateStyles as styles } from "@/components/email-template-styles";
import { getSiteUrl } from "@/lib/site-url";

interface EmailTemplateProps {
  type: "confirmation" | "welcome" | "password-reset";
  userName?: string;
  confirmationUrl?: string;
  resetUrl?: string;
}

const PREHEADER_STYLE = {
  display: "none",
  visibility: "hidden",
  msoHide: "all",
} as React.CSSProperties;

export function EmailTemplate({
  type,
  userName = "there",
  confirmationUrl = "#",
  resetUrl = "#",
}: EmailTemplateProps) {
  const baseUrl = getSiteUrl();

  const templates = {
    confirmation: {
      subject: "Confirm your Inkdown account",
      preheader: "Click the link to verify your email and start writing.",
      heading: "Confirm your email",
      body: "Thanks for signing up for Inkdown! Please confirm your email address to start creating and sharing beautiful markdown documents.",
      buttonText: "Confirm Email",
      buttonUrl: confirmationUrl,
    },
    welcome: {
      subject: "Welcome to Inkdown",
      preheader: "Your account is ready. Start writing beautiful markdown.",
      heading: `Welcome to Inkdown, ${userName}!`,
      body: "Your account has been confirmed and you're all set to start writing. Create your first document and experience the joy of organized markdown.",
      buttonText: "Open Inkdown",
      buttonUrl: `${baseUrl}/`,
    },
    "password-reset": {
      subject: "Reset your Inkdown password",
      preheader: "Click the link to reset your password.",
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to create a new password. If you didn't request this, you can safely ignore this email.",
      buttonText: "Reset Password",
      buttonUrl: resetUrl,
    },
  };

  const content = templates[type];

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>{content.subject}</title>
        <span style={PREHEADER_STYLE}>{content.preheader}</span>
      </head>
      <body style={styles.body}>
        <table role="presentation" style={styles.container} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={styles.wrapper}>
                <table role="presentation" style={styles.header} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={styles.logoCell}>
                        <img
                          src={`${baseUrl}/favicon.png`}
                          alt="Inkdown"
                          width="48"
                          height="48"
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
                          This email was sent by Inkdown. If you have questions, please contact us
                          at{" "}
                          <a href="mailto:dev@shubhojeet.com" style={styles.footerLink}>
                            dev@shubhojeet.com
                          </a>
                        </p>
                        <p style={styles.footerMuted}>
                          Inkdown - Your markdown, beautifully organized.
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
