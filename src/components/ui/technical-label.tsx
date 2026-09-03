import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Optional section number rendered ahead of a hairline rule. */
  index?: string;
  className?: string;
  tone?: "light" | "dark";
};

/**
 * Mono, letter-spaced caps used for section numbers and metadata. The rule
 * between the number and the text gives sections an engineered, drawn feel.
 */
export function TechnicalLabel({
  children,
  index,
  className,
  tone = "dark",
}: Props) {
  const accent = tone === "dark" ? "text-signal-green" : "text-cedar-ink";
  const muted = tone === "dark" ? "text-steel-text" : "text-forge-black/55";
  const rule = tone === "dark" ? "bg-muted-steel/40" : "bg-forge-black/20";

  return (
    <p className={cn("label-technical flex items-center gap-3", className)}>
      {index ? (
        <>
          <span className={accent}>{index}</span>
          <span aria-hidden="true" className={cn("h-px w-8", rule)} />
        </>
      ) : null}
      <span className={muted}>{children}</span>
    </p>
  );
}
