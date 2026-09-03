import type { Metadata, Viewport } from "next";
import { DM_Mono, Manrope } from "next/font/google";

import { MotionProvider } from "@/components/motion-provider";
import { siteConfig } from "@/lib/site";
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
  /*
   * Descriptive terms only, matching services the site actually describes.
   * Modern engines ignore this tag; it is here for internal clarity on the
   * positioning rather than for ranking.
   */
  keywords: [
    "growth systems for service businesses",
    "AI automation Cedar Rapids",
    "AI workflow consulting",
    "business process automation",
    "Cedar Rapids web design",
    "local SEO for Iowa businesses",
  ],
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
        {/*
         * Shell only. Site chrome lives in (marketing)/layout.tsx so the admin
         * area can render without the marketing header and footer. Motion
         * policy stays here because it is a global accessibility concern.
         */}
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
