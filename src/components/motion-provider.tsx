"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Global motion policy.
 *
 * `reducedMotion="user"` lets Framer Motion read the user's preference
 * internally, at animation time. That matters: branching on the
 * `useReducedMotion()` hook instead would change prop shapes between the first
 * client render and the effect that resolves the media query, and Framer's
 * already-written inline `opacity: 0` would never be animated away. Reduced
 * motion users would be left staring at invisible content.
 *
 * With this in place every visitor gets the identical component tree, and
 * Framer skips transform and layout animations for those who asked for less
 * motion, jumping straight to the resolved value. Decorative CSS keyframes are
 * neutralised separately by the reduced-motion block in globals.css.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
