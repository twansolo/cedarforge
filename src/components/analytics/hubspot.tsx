import Script from "next/script";

import { hubspot } from "@/lib/site";

/**
 * HubSpot tracking code.
 *
 * Rendered from the marketing layout only, so the admin area stays out of
 * HubSpot's analytics and no tracking cookie is set behind the login.
 *
 * The portal id is public (it ships in the script URL on every page) and never
 * changes per environment, so it lives in committed config rather than an
 * environment variable. That keeps production from silently losing tracking
 * because a variable was missed in the hosting dashboard.
 *
 * `strategy="afterInteractive"` is the next/script default and matches the
 * `async defer` behaviour of HubSpot's own snippet: the loader is fetched early
 * but never blocks hydration.
 */
export function HubSpotTracking() {
  /*
   * Skip local development and Vercel preview deployments so only real traffic
   * on the production domain reaches the portal. `next build && next start`
   * locally sets NODE_ENV to production and will load the script; run `next dev`
   * for day-to-day work if you want it off.
   */
  const isProductionTraffic =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview";

  if (!isProductionTraffic) {
    return null;
  }

  return (
    <Script
      id="hs-script-loader"
      strategy="afterInteractive"
      src={`https://js-${hubspot.region}.hs-scripts.com/${hubspot.portalId}.js`}
    />
  );
}
