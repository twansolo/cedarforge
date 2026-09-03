import { readFile } from "node:fs/promises";
import path from "node:path";

import { cn } from "@/lib/utils";

/**
 * Renders a supplied horizontal lockup inline, rather than through next/image.
 *
 * Both lockup SVGs set their wordmark with `font-family="Manrope, ..."`. Served
 * through an <img>, the SVG renders in its own document with no access to the
 * page's webfonts, so it silently falls back to Arial — about 8% wider, with
 * different letterforms. Inlining puts the markup in the page's own document,
 * where `next/font` has registered Manrope and DM Mono under those exact family
 * names, so the wordmark renders in the brand typeface with no edit to the file.
 *
 * The read resolves at build time: every page using this is statically
 * prerendered, so `public/` is present. If a consuming route ever becomes
 * dynamic, move these two files under `src/` so they stay inside the bundle.
 */

const files = {
  /** Dark artboard (#0B0E0C). For Forge Black surfaces. */
  dark: "Cedar-Forge-Logo-Dark.svg",
  /** Light artboard (#F4F5F1). For Workshop White surfaces. */
  primary: "Cedar-Forge-Primary-Logo.svg",
} as const;

export type LockupVariant = keyof typeof files;

const cache = new Map<LockupVariant, string>();

async function loadLockup(variant: LockupVariant, label: string) {
  const cached = cache.get(variant);
  if (cached) return cached.replace(/__LABEL__/, label);

  const raw = await readFile(
    path.join(process.cwd(), "public", files[variant]),
    "utf8",
  );

  const markup = raw
    // Drop embedded a11y nodes; the wrapper supplies a single accessible name.
    .replace(/<title[^>]*>[\s\S]*?<\/title>/g, "")
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/g, "")
    .replace(/\s+aria-labelledby="[^"]*"/g, "")
    .replace(/\s+aria-label="[^"]*"/g, "")
    // Size from CSS, not the artboard's intrinsic attributes.
    .replace(/\s+(width|height)="\d+"(?=[^>]*viewBox)/g, "")
    .replace(
      "<svg",
      '<svg role="img" aria-label="__LABEL__" class="h-full w-auto"',
    )
    .trim();

  cache.set(variant, markup);
  return markup.replace(/__LABEL__/, label);
}

type Props = {
  variant: LockupVariant;
  /** Accessible name for the lockup. */
  label: string;
  /** Height utilities, e.g. "h-12 sm:h-14". */
  className?: string;
};

export async function BrandLockup({ variant, label, className }: Props) {
  const markup = await loadLockup(variant, label);

  return (
    <span
      className={cn("inline-block", className)}
      // Local build-time asset, not user input.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
