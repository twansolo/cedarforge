/**
 * Cookie side of the admin session.
 *
 * Importing `next/headers` makes this module unusable from a client component:
 * Next fails the build if it is ever pulled into the browser bundle, which is
 * the guarantee we want around session writes.
 */

import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/admin/config";
import {
  createSessionToken,
  verifySessionToken,
  type AdminSession,
} from "@/lib/admin/session-token";

/**
 * Issues a session cookie. Only callable from a server action or route handler,
 * since server components are not allowed to write cookies.
 *
 * Returns false when the admin area is misconfigured, so the caller can report
 * that instead of silently appearing to sign the operator in.
 */
export async function startAdminSession(subject = "admin"): Promise<boolean> {
  const token = await createSessionToken(subject, SESSION_MAX_AGE_SECONDS);
  if (!token) return false;

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
  );

  return true;
}

/** Clears the session cookie. */
export async function endAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  // Overwrite with an immediately-expiring value, then delete, so the browser
  // drops it even if it ignores one of the two.
  cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Reads and verifies the session cookie. Returns `null` when not signed in. */
export async function readAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
