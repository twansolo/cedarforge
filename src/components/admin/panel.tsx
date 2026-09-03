import type { ReactNode } from "react";

import { TechnicalLabel } from "@/components/ui/technical-label";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

/** Raised surface used for every admin card and form block. */
export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "border border-muted-steel/25 bg-steel-800/70 p-6 sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PanelHeadingProps = {
  title: string;
  label?: string;
  index?: string;
  description?: string;
  children?: ReactNode;
};

/** Section heading with the site's mono label treatment. */
export function PanelHeading({
  title,
  label,
  index,
  description,
  children,
}: PanelHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {label ? <TechnicalLabel index={index}>{label}</TechnicalLabel> : null}
        <h2
          className={cn(
            "text-subhead font-extrabold tracking-tight text-workshop-white",
            label && "mt-3",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl leading-relaxed text-steel-text">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

type StatusDotProps = {
  tone: "ok" | "missing" | "warn";
  label: string;
};

/**
 * Status indicator. The colour is decorative; the adjacent text carries the
 * meaning, so the state is never communicated by hue alone.
 */
export function StatusDot({ tone, label }: StatusDotProps) {
  const colour =
    tone === "ok"
      ? "bg-signal-green"
      : tone === "warn"
        ? "bg-cedar-heartwood"
        : "bg-muted-steel";

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", colour)}
      />
      <span className="text-sm font-medium text-workshop-white">{label}</span>
    </span>
  );
}
