import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/dal";

/**
 * Signed-in area.
 *
 * The check here keeps the chrome from rendering for anonymous traffic, but it
 * is not the whole guarantee: a layout does not re-run when navigating between
 * sibling pages beneath it, so every page under this group calls
 * `requireAdmin()` as well. `cache()` makes the repeat effectively free.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AdminShell
      subject={session.sub}
      expiresAt={new Date(session.exp * 1000).toISOString()}
    >
      {children}
    </AdminShell>
  );
}
