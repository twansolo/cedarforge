import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Header/inline lockup: the supplied icon mark paired with live text for the
 * wordmark.
 *
 * The full horizontal logo SVG sets its wordmark in Manrope via `font-family`,
 * but an SVG loaded through `next/image` renders in its own document and cannot
 * reach the page's webfonts, so it would silently fall back to Arial. Rendering
 * the wordmark as real text keeps the brand typeface, stays crisp at small
 * sizes, and scales down cleanly on mobile.
 */
export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      <Image
        src="/Cedar-Forge-Icon.svg"
        alt=""
        aria-hidden="true"
        width={34}
        height={34}
        priority
        className="size-7 shrink-0 sm:size-[34px]"
      />
      <span className="flex flex-col justify-center">
        <span className="text-[0.9375rem] font-extrabold leading-none tracking-[0.12em] text-workshop-white sm:text-base">
          CEDAR FORGE<span className="text-signal-green">.AI</span>
        </span>
        {showTagline ? (
          <span className="label-technical mt-1.5 hidden text-[0.5625rem] text-steel-text lg:block">
            Intelligent Growth Systems
          </span>
        ) : null}
      </span>
    </span>
  );
}
