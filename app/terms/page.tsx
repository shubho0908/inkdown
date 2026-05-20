import type { Metadata } from "next";
import Link from "next/link";
import { InkdownLogo } from "@/components/inkdown-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Inkdown.",
};

const LAST_UPDATED = "March 24, 2025";

export default function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <InkdownLogo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 size-4" />
                <span className="hidden sm:inline">Back</span>
                <span className="sr-only sm:hidden">Back</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          <article className="prose prose-neutral dark:prose-invert max-w-none break-words space-y-8 text-sm leading-7 sm:text-base">
            <section>
              <h2 className="text-2xl font-semibold">1. Agreement to Terms</h2>
              <p>
                By accessing and using Inkdown (&ldquo;Service&rdquo;), you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="text-2xl font-semibold">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) from Inkdown for personal,
                non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may
                not:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-2">
                <li>Modifying or copying the materials</li>
                <li>
                  Using the materials for any commercial purpose or for any
                  public display
                </li>
                <li>
                  Attempting to decompile or reverse engineer any software
                  contained on Inkdown
                </li>
                <li>
                  Removing any copyright or other proprietary notations from the
                  materials
                </li>
                <li>
                  Transferring the materials to another person or
                  &ldquo;mirroring&rdquo; the materials on any other server
                </li>
                <li>
                  Using automated tools to scrape, crawl, or bulk download
                  content
                </li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold">3. Disclaimer</h2>
              <p>
                The materials on Inkdown are provided on an &lsquo;as
                is&rsquo; basis. Inkdown makes no warranties, expressed or
                implied, and hereby disclaims and negates all other warranties
                including, without limitation, implied warranties or conditions
                of merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </p>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="text-2xl font-semibold">4. Limitations</h2>
              <p>
                In no event shall Inkdown or its suppliers be liable for any
                damages (including, without limitation, damages for loss of data
                or profit, or due to business interruption) arising out of the
                use or inability to use the materials on Inkdown, even if we or
                our authorized representative has been notified orally or in
                writing of the possibility of such damage.
              </p>
            </section>

            {/* Accuracy of Materials */}
            <section>
              <h2 className="text-2xl font-semibold">
                5. Accuracy of Materials
              </h2>
              <p>
                The materials appearing on Inkdown could include technical,
                typographical, or photographic errors. Inkdown does not warrant
                that any of the materials on our platform are accurate,
                complete, or current. Inkdown may make changes to the materials
                contained on our platform at any time without notice.
              </p>
            </section>

            {/* Materials and Content */}
            <section>
              <h2 className="text-2xl font-semibold">
                6. Materials and Content
              </h2>
              <p>
                The materials on Inkdown are owned by or licensed to us and are
                protected by copyright and other intellectual property laws. You
                retain all rights to the content you create and upload to
                Inkdown. By uploading content, you grant Inkdown a
                non-exclusive, worldwide, royalty-free license to store,
                display, and distribute your content solely for the purpose of
                providing the Service.
              </p>
              <p>
                You may not upload, post, or otherwise transmit through Inkdown
                any content that is unlawful, threatening, abusive, defamatory,
                obscene, vulgar, sexually explicit, or otherwise objectionable.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold">7. User Accounts</h2>
              <p>
                When you create an account with Inkdown, you are responsible for
                maintaining the confidentiality of your password and account
                information. You agree to accept responsibility for all
                activities that occur under your account. You must notify us
                immediately of any unauthorized use of your account.
              </p>
              <p>
                We reserve the right to refuse service to anyone at any time and
                for any reason.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold">8. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason whatsoever, including
                if you breach these Terms of Service. Upon termination, your
                right to use the Service will immediately cease.
              </p>
            </section>

            {/* Prohibited Conduct */}
            <section>
              <h2 className="text-2xl font-semibold">9. Prohibited Conduct</h2>
              <p>
                You agree not to engage in any of the following prohibited
                behavior:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-2">
                <li>
                  Harassing or causing distress or inconvenience to any person
                </li>
                <li>
                  Obscene or abusive language or otherwise offensive content
                </li>
                <li>
                  Disrupting the normal flow of dialogue within our website
                </li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>
                  Impersonating or attempting to impersonate any person or
                  entity
                </li>
                <li>
                  Uploading or transmitting viruses or any other malicious code
                </li>
                <li>
                  Collecting or tracking personal information of others without
                  consent
                </li>
              </ul>
            </section>

            {/* Document Sharing and Public Content */}
            <section>
              <h2 className="text-2xl font-semibold">
                10. Document Sharing and Public Content
              </h2>
              <p>
                When you make a document public, you understand that anyone with
                the link will be able to view the content. You are responsible
                for ensuring that shared documents do not violate the rights of
                any third parties or contain unlawful content.
              </p>
              <p>
                Inkdown is not responsible for the content of publicly shared
                documents or for any third-party use of such content.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold">
                11. Limitation of Liability
              </h2>
              <p>
                In no event shall Inkdown, its directors, employees, or agents
                be liable to you for any indirect, incidental, special,
                consequential, or punitive damages resulting from your use of or
                inability to use the Service.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Inkdown and its
                officers, directors, employees, agents, and successors from and
                against any and all claims, damages, losses, costs, and expenses
                (including reasonable attorneys&rsquo; fees) arising out of or
                related to your use of the Service or your violation of these
                Terms of Service.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold">13. Third-Party Links</h2>
              <p>
                Inkdown may contain links to third-party websites. We are not
                responsible for the content, accuracy, or practices of these
                external sites. Your use of third-party websites is governed by
                their terms of service and privacy policies. We do not endorse
                or guarantee third-party websites or their content.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold">
                14. Changes to These Terms
              </h2>
              <p>
                Inkdown reserves the right to revise these Terms of Service at
                any time without notice. By using this website, you are agreeing
                to be bound by the then current version of these Terms of
                Service.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold">
                15. Contact Information
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="mt-4 rounded-lg bg-muted p-4">
                <p className="font-semibold">Inkdown Support</p>
                <p className="mt-1">
                  Email:{" "}
                  <a
                    href="mailto:dev@shubhojeet.com"
                    className="text-primary hover:underline"
                  >
                    dev@shubhojeet.com
                  </a>
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold">16. Governing Law</h2>
              <p>
                These Terms of Service and Privacy Policy are governed by and
                construed in accordance with the laws of the jurisdiction where
                Inkdown is operated, and you irrevocably submit to the exclusive
                jurisdiction of the courts in that location.
              </p>
            </section>
          </article>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          <p>&copy; 2025 Inkdown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
