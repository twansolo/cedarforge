/**
 * Admin data access layer.
 *
 * The proxy in src/proxy.ts is an optimistic gate: it keeps unauthenticated
 * traffic out of the admin routes early and cheaply. It is not the security
 * boundary. This is.
 *
 * Every admin page, server action, and route handler must call `requireAdmin()`
 * before it reads data or performs work. That keeps the check next to the thing
 * being protected, so a new tool cannot be reached by a request that skips the
 * proxy (direct server action invocation, a missed matcher, a future rewrite).
 */

import { redirect } from "next/navigation";
import { cache } from "react";

import { ADMIN_LOGIN_PATH } from "@/lib/admin/config";
import { readAdminSession } from "@/lib/admin/session";
import type { AdminSession } from "@/lib/admin/session-token";

/**
 * Verified session for the current request, or `null`.
 *
 * `cache` memoises this for the duration of one render pass, so a layout, a
 * page, and three tool components asking the same question cost one
 * verification rather than five.
 */
export const getAdminSession = cache(
  async (): Promise<AdminSession | null> => readAdminSession(),
);

/**
 * Guard for admin pages. Redirects to the login screen when there is no valid
 * session, and otherwise returns it.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/** Raised by `assertAdmin` so callers can distinguish auth failure from a bug. */
export class AdminAuthError extends Error {
  constructor() {
    super("Admin authentication required.");
    this.name = "AdminAuthError";
  }
}

/**
 * Guard for server actions and route handlers.
 *
 * A server action is its own addressable endpoint. It does not inherit the
 * check performed by the page that rendered its form, so every action calls
 * this first. It throws rather than redirects, because a mutation that is not
 * allowed should fail loudly instead of navigating.
 */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new AdminAuthError();
  return session;
}
