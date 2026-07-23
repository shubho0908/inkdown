import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { createSocialImageSet } from "@/lib/social-metadata";
import { getSiteUrlObject } from "@/lib/site-url";
import { themeBootstrapScript } from "@/lib/theme-bootstrap";
import { jetBrainsMono, plusJakartaSans } from "./fonts";
import "./globals.css";

const rootSocialImages = createSocialImageSet(
  "/",
  "Inkdown homepage preview - create, organize, and share markdown documents",
);

export const metadata: Metadata = {
  title: {
    default: "Inkdown - Markdown Editor & Workspace",
    template: "%s | Inkdown",
  },
  applicationName: "Inkdown",
  description:
    "Inkdown is a markdown workspace for writing, organizing, and sharing documents. Write with live preview, manage folders, and publish public links from one focused editor.",
  keywords: [
    "markdown editor",
    "markdown workspace",
    "markdown notes",
    "document sharing",
    "live preview editor",
    "writing app",
    "note taking",
    "markdown publishing",
    "knowledge base",
    "collaborative writing",
  ],
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
    title: "Inkdown - Markdown Editor & Workspace",
    description:
      "Write, organize, and share markdown documents with live preview, folder management, and instant public publishing.",
    siteName: "Inkdown",
    images: rootSocialImages.openGraph,
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkdown - Markdown Editor & Workspace",
    description:
      "Write, organize, and share markdown documents with live preview and public publishing.",
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}
    >
      <body className="font-sans antialiased selection:bg-primary/20">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
