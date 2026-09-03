import type { ReactNode } from "react";

import { HubSpotTracking } from "@/components/analytics/hubspot";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { buildStructuredData } from "@/lib/structured-data";

/**
 * Public site chrome.
 *
 * This lives in a route group rather than the root layout so the admin area can
 * render without the marketing header, footer, and organisation schema. The
 * group name is in parentheses, so it adds nothing to the URL: the page below
 * is still `/`.
 */
export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-signal-green focus:bg-forge-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-workshop-white"
      >
        Skip to content
      </a>

      <Header />
      {children}
      <Footer />

      <script
        type="application/ld+json"
        // Server-rendered from typed data in src/lib/structured-data.ts.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildStructuredData()),
        }}
      />

      <HubSpotTracking />
    </>
  );
}
