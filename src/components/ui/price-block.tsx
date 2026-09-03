import { priceKindLabels, type PriceKind } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  price: string;
  priceKind: PriceKind;
  ongoingPrice?: string;
  tone?: "light" | "dark";
  size?: "md" | "lg";
  className?: string;
};

/**
 * Price with an explicit cadence label, so a one-time implementation is never
 * mistaken for a monthly retainer. Offers carrying both show them as two
 * separate lines rather than one combined figure.
 */
export function PriceBlock({
  price,
  priceKind,
  ongoingPrice,
  tone = "light",
  size = "md",
  className,
}: Props) {
  const isDark = tone === "dark";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p
        className={cn(
          "label-technical",
          isDark ? "text-signal-green" : "text-cedar-ink",
        )}
      >
        {priceKindLabels[priceKind]}
      </p>

      <p
        className={cn(
          "font-extrabold leading-none tracking-tight",
          size === "lg"
            ? "text-[1.75rem] sm:text-[2.125rem]"
            : "text-[1.625rem] sm:text-3xl",
          isDark ? "text-workshop-white" : "text-forge-black",
        )}
      >
        {price}
      </p>

      {ongoingPrice ? (
        <p
          className={cn(
            "flex items-center gap-2.5 text-base font-semibold",
            isDark ? "text-steel-text" : "text-forge-black/70",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-px w-4 shrink-0",
              isDark ? "bg-muted-steel/60" : "bg-forge-black/25",
            )}
          />
          {ongoingPrice}
        </p>
      ) : null}
    </div>
  );
}
