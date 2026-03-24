import type { Metadata } from 'next'
import Link from 'next/link'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Inkdown collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'March 24, 2025'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <InkdownLogo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:py-16">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold">1. Introduction</h2>
              <p>
                Inkdown ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our markdown editor and document sharing platform, including our website, web application, and related services (collectively, the "Service").
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold mt-4">2.1 Account Information</h3>
              <p>
                When you create an account, we collect information such as your email address and password. We use email for account management, notifications, and communication purposes.
              </p>

              <h3 className="text-lg font-semibold mt-4">2.2 Document and Content Data</h3>
              <p>
                We store and process the markdown documents, files, and folders you create within Inkdown. This content is encrypted and stored securely on our servers. You retain all ownership and rights to your content.
              </p>

              <h3 className="text-lg font-semibold mt-4">2.3 Usage Information</h3>
              <p>
                We automatically collect information about your interactions with the Service, including device information, IP address, browser type, referring pages, and pages visited. This data helps us improve our Service and understand user behavior patterns.
              </p>

              <h3 className="text-lg font-semibold mt-4">2.4 Cookies and Similar Technologies</h3>
              <p>
                We use cookies and similar tracking technologies to enhance your user experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser preferences.
              </p>

              <h3 className="text-lg font-semibold mt-4">2.5 Shared Document Metadata</h3>
              <p>
                When you make a document public and share it, we maintain metadata about the shared link including creation date, access count, and document title for analytics and abuse prevention purposes.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
              <p>We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Providing, maintaining, and improving the Service</li>
                <li>Processing transactions and sending related information</li>
                <li>Sending periodic emails regarding your account or Service updates</li>
                <li>Responding to your inquiries and providing customer support</li>
                <li>Monitoring and analyzing trends, usage, and activities for security and functionality</li>
                <li>Personalizing your experience and delivering tailored content</li>
                <li>Preventing fraudulent transactions and enhancing security</li>
                <li>Complying with legal obligations and resolving disputes</li>
              </ul>
            </section>

            {/* Data Protection and Security */}
            <section>
              <h2 className="text-2xl font-semibold">4. Data Protection and Security</h2>
              <p>
                We implement comprehensive technical, administrative, and physical safeguards to protect your personal information. However, no transmission over the Internet or electronic storage is completely secure. While we strive to use commercially reasonable means, we cannot guarantee absolute security.
              </p>
              <p>
                Your documents are encrypted in transit and at rest. Your password is hashed using industry-standard encryption. Access to personal information is restricted to employees who need it to provide services to you.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold">5. Data Retention</h2>
              <p>
                We retain your account information and documents for as long as your account is active. If you delete your account, we will delete your personal information and documents within 30 days, except where we are required to retain data for legal or compliance purposes.
              </p>
              <p>
                Shared public documents may remain accessible via their unique links even if you delete your account, unless you explicitly revoke sharing before deletion.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold">6. Third-Party Services</h2>
              <p>
                Inkdown uses third-party service providers including Supabase for database services and analytics platforms. These providers have their own privacy policies and we encourage you to review them. We do not share personal information with third parties without your consent, except as necessary to provide the Service or as required by law.
              </p>
            </section>

            {/* Your Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold">7. Your Privacy Rights</h2>
              <p>
                You have the right to access, update, correct, or delete your personal information at any time by logging into your account or contacting us. You may also request a copy of your data or object to our processing of your information.
              </p>
              <p>
                To exercise these rights, please contact us at <a href="mailto:dev@shubhojeet.com" className="text-primary hover:underline">dev@shubhojeet.com</a>.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold">8. Children's Privacy</h2>
              <p>
                Inkdown is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-semibold">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold">10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">Inkdown Support</p>
                <p className="mt-1">Email: <a href="mailto:dev@shubhojeet.com" className="text-primary hover:underline">dev@shubhojeet.com</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Inkdown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
