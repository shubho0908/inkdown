import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { createSocialImageSet } from "@/lib/social-metadata";
import { getSiteUrlObject } from "@/lib/site-url";
import { themeBootstrapScript } from "@/lib/theme-bootstrap";
import "./globals.css";

const rootSocialImages = createSocialImageSet(
  "/",
  "Inkdown homepage preview - create, organize, and share markdown documents",
);

export const metadata: Metadata = {
  title: {
    default: "Inkdown - Beautiful Markdown Editor & Sharing Platform",
    template: "%s | Inkdown",
  },
  applicationName: "Inkdown",
  description:
    "Create, organize, and share beautiful markdown documents. Inkdown provides a seamless writing experience with live preview, folder organization, and instant sharing.",
  keywords: ["markdown", "editor", "writing", "documentation", "notes", "sharing", "collaboration"],
  authors: [{ name: "Inkdown" }],
  creator: "Inkdown",
  publisher: "Inkdown",
  metadataBase: getSiteUrlObject(),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Inkdown - Beautiful Markdown Editor & Sharing Platform",
    description:
      "Create, organize, and share beautiful markdown documents with live preview and instant sharing.",
    siteName: "Inkdown",
    images: rootSocialImages.openGraph,
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkdown - Beautiful Markdown Editor",
    description: "Create, organize, and share beautiful markdown documents.",
    images: rootSocialImages.twitter,
  },
  icons: {
    icon: [{ url: "/icon-32x32.webp", sizes: "32x32", type: "image/webp" }],
    apple: "/apple-icon.webp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased selection:bg-primary/20">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
