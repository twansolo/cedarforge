import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const control =
  "w-full border bg-workshop-white px-4 py-3 text-[0.9375rem] text-forge-black " +
  "placeholder:text-forge-black/35 transition-colors duration-200 " +
  "focus:border-cedar-green focus-visible:outline-signal-green";

export const controlClasses = (hasError: boolean) =>
  cn(
    control,
    hasError
      ? "border-red-700"
      : "border-forge-black/20 hover:border-forge-black/35",
  );

type FieldProps = {
  /** Input id, also used to wire the label and error message. */
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Label, control, hint, and error wired together. The error is announced via
 * role="alert" and referenced by aria-describedby on the control itself.
 */
export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-2 text-sm font-semibold tracking-tight text-forge-black"
      >
        {label}
        {optional ? (
          <span className="label-technical text-forge-black/45">Optional</span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-forge-black/55">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[0.8125rem] font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Builds the aria-describedby value for a control. */
export function describedBy(id: string, hasError: boolean, hasHint: boolean) {
  const ids = [
    hasError ? `${id}-error` : null,
    hasHint && !hasError ? `${id}-hint` : null,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
}
