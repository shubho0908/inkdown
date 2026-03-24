import * as React from 'react'

interface EmailTemplateProps {
  type: 'confirmation' | 'welcome' | 'password-reset'
  userName?: string
  confirmationUrl?: string
  resetUrl?: string
}

export function EmailTemplate({
  type,
  userName = 'there',
  confirmationUrl = '#',
  resetUrl = '#',
}: EmailTemplateProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inkdown.app'

  const templates = {
    confirmation: {
      subject: 'Confirm your Inkdown account',
      preheader: 'Click the link to verify your email and start writing.',
      heading: 'Confirm your email',
      body: `Thanks for signing up for Inkdown! Please confirm your email address to start creating and sharing beautiful markdown documents.`,
      buttonText: 'Confirm Email',
      buttonUrl: confirmationUrl,
    },
    welcome: {
      subject: 'Welcome to Inkdown',
      preheader: 'Your account is ready. Start writing beautiful markdown.',
      heading: `Welcome to Inkdown, ${userName}!`,
      body: `Your account has been confirmed and you're all set to start writing. Create your first document and experience the joy of organized markdown.`,
      buttonText: 'Go to Dashboard',
      buttonUrl: `${baseUrl}/dashboard`,
    },
    'password-reset': {
      subject: 'Reset your Inkdown password',
      preheader: 'Click the link to reset your password.',
      heading: 'Reset your password',
      body: `We received a request to reset your password. Click the button below to create a new password. If you didn't request this, you can safely ignore this email.`,
      buttonText: 'Reset Password',
      buttonUrl: resetUrl,
    },
  }

  const content = templates[type]

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>{content.subject}</title>
        {/* Preheader text for email clients */}
        <span style={{ display: 'none', visibility: 'hidden', msoHide: 'all' } as React.CSSProperties}>
          {content.preheader}
        </span>
      </head>
      <body style={styles.body}>
        <table
          role="presentation"
          style={styles.container}
          cellPadding="0"
          cellSpacing="0"
        >
          <tbody>
            <tr>
              <td style={styles.wrapper}>
                {/* Header with Logo */}
                <table
                  role="presentation"
                  style={styles.header}
                  cellPadding="0"
                  cellSpacing="0"
                >
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

                {/* Main Content */}
                <table
                  role="presentation"
                  style={styles.content}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td style={styles.contentCell}>
                        <h1 style={styles.heading}>{content.heading}</h1>
                        <p style={styles.paragraph}>{content.body}</p>

                        {/* CTA Button */}
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

                        {/* Alternative Link */}
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

                {/* Footer */}
                <table
                  role="presentation"
                  style={styles.footer}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td style={styles.footerCell}>
                        <p style={styles.footerText}>
                          This email was sent by Inkdown. If you have questions,
                          please contact us at{' '}
                          <a href="mailto:support@inkdown.app" style={styles.footerLink}>
                            support@inkdown.app
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
  )
}

// Inline styles for email compatibility
const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#f8f7fc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#f8f7fc',
  },
  wrapper: {
    padding: '40px 20px',
  },
  header: {
    width: '100%',
    marginBottom: '32px',
  },
  logoCell: {
    textAlign: 'center',
    padding: '0 0 24px 0',
  },
  logo: {
    borderRadius: '12px',
    verticalAlign: 'middle',
  },
  logoText: {
    display: 'inline-block',
    marginLeft: '12px',
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1625',
    verticalAlign: 'middle',
  },
  content: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(107, 70, 193, 0.08)',
  },
  contentCell: {
    padding: '48px 40px',
  },
  heading: {
    margin: '0 0 16px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1625',
    lineHeight: 1.3,
  },
  paragraph: {
    margin: '0 0 32px 0',
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#4a4458',
  },
  buttonContainer: {
    margin: '0 0 24px 0',
  },
  buttonCell: {
    textAlign: 'center',
  },
  button: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: '8px',
  },
  altLink: {
    margin: '24px 0 0 0',
    fontSize: '13px',
    color: '#7c7589',
    lineHeight: 1.6,
    wordBreak: 'break-all',
  },
  link: {
    color: '#7c3aed',
    textDecoration: 'underline',
  },
  footer: {
    width: '100%',
    marginTop: '32px',
  },
  footerCell: {
    textAlign: 'center',
    padding: '24px',
  },
  footerText: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#7c7589',
    lineHeight: 1.5,
  },
  footerLink: {
    color: '#7c3aed',
    textDecoration: 'underline',
  },
  footerMuted: {
    margin: '16px 0 0 0',
    fontSize: '12px',
    color: '#a3a0ad',
  },
}

// Preview component for development
export function EmailTemplatePreview() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Confirmation Email</h2>
        <div className="rounded-lg border shadow-sm">
          <EmailTemplate type="confirmation" confirmationUrl="https://inkdown.app/confirm?token=abc123" />
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold">Welcome Email</h2>
        <div className="rounded-lg border shadow-sm">
          <EmailTemplate type="welcome" userName="John" />
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold">Password Reset Email</h2>
        <div className="rounded-lg border shadow-sm">
          <EmailTemplate type="password-reset" resetUrl="https://inkdown.app/reset?token=xyz789" />
        </div>
      </div>
    </div>
  )
}
