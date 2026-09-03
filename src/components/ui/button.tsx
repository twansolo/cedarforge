import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-tight " +
  "transition-[background-color,border-color,color,transform] duration-200 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-cedar-ink text-workshop-white hover:bg-signal-green hover:text-forge-black",
  secondary:
    "border border-muted-steel/45 text-workshop-white hover:border-signal-green hover:text-signal-green",
  ghost:
    "border border-forge-black/15 text-forge-black hover:border-cedar-green hover:text-cedar-ink",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3.5 text-[0.9375rem]",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
