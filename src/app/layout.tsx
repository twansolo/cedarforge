import type { Metadata, Viewport } from "next";
import { DM_Mono, Manrope } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MotionProvider } from "@/components/motion-provider";
import { siteConfig } from "@/lib/site";
import { buildStructuredData } from "@/lib/structured-data";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/Cedar-Forge-Favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: "en_US",
    images: [
      {
        url: siteConfig.socialCard,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.socialCard],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0B0E0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmMono.variable}`}>
      <body className="antialiased">
        <a
          href="#hero"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-signal-green focus:bg-forge-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-workshop-white"
        >
          Skip to content
        </a>

        <MotionProvider>
          <Header />
          {children}
          <Footer />
        </MotionProvider>

        <script
          type="application/ld+json"
          // Server-rendered from typed data in src/lib/structured-data.ts.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildStructuredData()),
          }}
        />
      </body>
    </html>
  );
}
