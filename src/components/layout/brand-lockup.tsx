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

const cache = new Map<string, string>();

/**
 * Removes the full-bleed background rect, so the lockup sits on whatever the
 * surrounding surface is.
 *
 * Both files open with a rect covering the whole artboard. That is correct on an
 * opaque surface of the same colour, but on a translucent one it reads as a
 * solid patch: the header is `bg-forge-black/90` over a backdrop blur, so an
 * opaque plate would show through as a logo-shaped block whenever light content
 * scrolled beneath it.
 *
 * The rect is matched against the viewBox dimensions rather than by position, so
 * only a true full-bleed background is removed and any rect that is part of the
 * artwork, such as the green rule under the wordmark, is left alone.
 */
function stripPlate(markup: string) {
  const viewBox = markup.match(
    /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/,
  );
  if (!viewBox) return markup;

  const [, width, height] = viewBox;
  const plate = new RegExp(
    `<rect\\s+width="${width}"\\s+height="${height}"[^>]*/>\\s*`,
  );

  return markup.replace(plate, "");
}

/**
 * Normalises the root `<svg>` tag.
 *
 * The accessibility and sizing attributes the files ship with are dropped and
 * replaced with ours: the source declares its own `role` and `aria-label`, and
 * appending a second pair would emit duplicate attributes, which is invalid HTML
 * even though browsers keep the first and ignore the rest. Intrinsic `width` and
 * `height` go too, so the caller's height utilities drive the size while
 * `viewBox` preserves the aspect ratio.
 *
 * Scoped to the opening tag rather than applied across the whole document, so
 * nothing in the artwork itself can be caught by these rewrites.
 */
function rewriteRootTag(tag: string) {
  const attributes = tag
    // Keep the whitespace that follows `<svg`, so every remaining attribute is
    // still preceded by a space and the strip below cannot miss the first one.
    .replace(/^<svg/, "")
    .replace(/\s*\/?>$/, "")
    .replace(/\s+(?:role|aria-label|aria-labelledby|width|height)="[^"]*"/g, "")
    .trim();

  return `<svg role="img" aria-label="__LABEL__" class="h-full w-auto" ${attributes}>`;
}

/**
 * Removes the tagline and the short rule above it.
 *
 * The tagline is set at `font-size="19"` against the wordmark's `84`, a ratio
 * that only holds up at display sizes. In the 72px header the wordmark renders
 * around 20px while the tagline collapses to roughly 4px, which is texture
 * rather than text. Dropping it leaves the monogram and wordmark, both of which
 * stay legible.
 *
 * The tagline is matched by its typeface: it is the only element set in DM Mono,
 * the wordmark being Manrope. The rule is the `<rect>` immediately before it.
 * Both files are laid out this way.
 */
function stripTagline(markup: string) {
  return markup.replace(
    /\s*<rect\b[^>]*\/>\s*<text\b[^>]*DM Mono[^>]*>[\s\S]*?<\/text>/,
    "",
  );
}

async function loadLockup(
  variant: LockupVariant,
  label: string,
  plate: boolean,
  tagline: boolean,
) {
  const key = `${variant}:${plate}:${tagline}`;
  const cached = cache.get(key);
  if (cached) return cached.replace(/__LABEL__/, label);

  const raw = await readFile(
    path.join(process.cwd(), "public", files[variant]),
    "utf8",
  );

  let source = raw;
  if (!plate) source = stripPlate(source);
  if (!tagline) source = stripTagline(source);

  const markup = source
    // Drop embedded a11y nodes; the wrapper supplies a single accessible name.
    .replace(/<title[^>]*>[\s\S]*?<\/title>/g, "")
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/g, "")
    .replace(/<svg\s[^>]*>/, rewriteRootTag)
    .trim();

  cache.set(key, markup);
  return markup.replace(/__LABEL__/, label);
}

type Props = {
  variant: LockupVariant;
  /** Accessible name for the lockup. */
  label: string;
  /** Height utilities, e.g. "h-12 sm:h-14". */
  className?: string;
  /**
   * Keep the artboard background. Leave this on for opaque surfaces that match
   * the variant; turn it off on translucent ones. See `stripPlate`.
   */
  plate?: boolean;
  /**
   * Keep the tagline. Turn it off below roughly 80px of height, where it stops
   * being readable. See `stripTagline`.
   */
  tagline?: boolean;
};

export async function BrandLockup({
  variant,
  label,
  className,
  plate = true,
  tagline = true,
}: Props) {
  const markup = await loadLockup(variant, label, plate, tagline);

  return (
    <span
      className={cn("inline-block", className)}
      // Local build-time asset, not user input.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
