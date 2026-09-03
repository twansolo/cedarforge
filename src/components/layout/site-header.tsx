import { BrandLockup } from "@/components/layout/brand-lockup";
import { Header } from "@/components/layout/header";
import { siteConfig } from "@/lib/site";

/**
 * Composes the brand lockup into the header.
 *
 * `BrandLockup` inlines an SVG read from disk, so it is an async server
 * component, while `Header` is a client component for its scroll and menu
 * state. A server component cannot be imported into a client one, but its
 * rendered output can be passed in as a prop, which is what happens here.
 *
 * This wrapper exists so the marketing layout and the root 404 (which sits
 * outside the marketing route group and brings its own chrome) stay in sync
 * rather than each assembling the same lockup.
 */
export function SiteHeader() {
  return (
    <Header
      lockup={
        /*
         * The dark variant matches the Forge Black bar. `plate={false}` drops
         * the artboard background, which would otherwise show as a solid block
         * against the translucent, blurred header. `tagline={false}` drops the
         * strapline, which renders around 4px at this size; the accessible name
         * below still carries it.
         */
        <BrandLockup
          variant="dark"
          plate={false}
          tagline={false}
          label={`${siteConfig.name} — ${siteConfig.tagline}`}
          className="h-12 sm:h-14"
        />
      }
    />
  );
}
