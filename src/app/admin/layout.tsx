import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Outer admin layout. Deliberately holds no auth check: the login screen is
 * nested under /admin, and guarding here would redirect it to itself.
 *
 * The guard lives in `(dashboard)/layout.tsx` and, because layouts do not
 * re-render on every navigation, is repeated in each page through
 * `requireAdmin()`.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
