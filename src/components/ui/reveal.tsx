"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Travel distance in pixels. */
  distance?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
};

/**
 * Scroll-triggered reveal.
 *
 * Props are deliberately unconditional. The reduced-motion policy lives in
 * MotionProvider (`reducedMotion="user"`), which drops the y translation and
 * leaves a plain fade, so content always resolves to its final state.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 18,
  className,
  as = "div",
}: Props) {
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
