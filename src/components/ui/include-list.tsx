import { cn } from "@/lib/utils";

type Props = {
  items: readonly string[];
  label: string;
  tone?: "light" | "dark";
  /** Split into two columns on wider viewports. */
  columns?: 1 | 2;
  className?: string;
};

/** Scope list drawn with hairlines rather than bullets or check icons. */
export function IncludeList({
  items,
  label,
  tone = "light",
  columns = 1,
  className,
}: Props) {
  const isDark = tone === "dark";

  return (
    <ul
      aria-label={label}
      className={cn(
        "border-t",
        isDark ? "border-muted-steel/25" : "border-forge-black/12",
        columns === 2 && "sm:grid sm:grid-cols-2 sm:gap-x-8",
        className,
      )}
    >
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-baseline gap-3 border-b py-2.5",
            isDark ? "border-muted-steel/25" : "border-forge-black/12",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-2 h-px w-3 shrink-0",
              isDark ? "bg-signal-green" : "bg-cedar-ink",
            )}
          />
          <span
            className={cn(
              "text-base leading-snug",
              isDark ? "text-workshop-white" : "text-forge-black",
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Qualification note. Always visible, never behind a tooltip. */
export function OfferNote({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const isDark = tone === "dark";

  return (
    <p
      className={cn(
        "flex gap-3 text-base leading-relaxed",
        isDark ? "text-steel-text" : "text-forge-black/65",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-2.5 h-px w-5 shrink-0",
          isDark ? "bg-muted-steel/60" : "bg-forge-black/25",
        )}
      />
      <span>{children}</span>
    </p>
  );
}
