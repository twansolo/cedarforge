/**
 * Admin area constants, shared by the proxy, the server actions, and the DAL.
 *
 * This file is deliberately free of `next/headers` and `node:crypto` imports so
 * it can be pulled into any runtime without dragging server-only APIs along.
 */

/** Where unauthenticated visitors are sent. */
export const ADMIN_LOGIN_PATH = "/admin/login";

/** Landing route once signed in. */
export const ADMIN_HOME_PATH = "/admin";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Cookie name. In production the `__Host-` prefix is a browser-enforced
 * guarantee: the cookie must be Secure, must have Path=/, and must carry no
 * Domain attribute, which stops a subdomain from writing or overwriting it.
 * Dev runs over plain http where `__Host-` cookies are rejected, so the prefix
 * is dropped locally.
 */
export const SESSION_COOKIE_NAME = isProduction
  ? "__Host-cf_admin_session"
  : "cf_admin_session";

/** Absolute session lifetime. Re-authentication is required after this. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Sliding window. Once a session has less than this much life left, the proxy
 * issues a fresh cookie so active work is not interrupted, while an idle
 * session still expires.
 */
export const SESSION_REFRESH_WITHIN_SECONDS = 60 * 60 * 4;

/** Cookie attributes. Kept in one place so every writer agrees. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Response headers applied to every admin response. The admin area is never
 * indexed, never cached, and never framed.
 */
export const ADMIN_RESPONSE_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Narrows a post-login redirect target to an internal admin path.
 *
 * Anything else — absolute URLs, protocol-relative `//host` values, backslash
 * tricks — falls back to the admin home, which closes the open-redirect hole
 * that a `?next=` parameter otherwise opens.
 */
export function safeAdminRedirect(target: unknown): string {
  if (typeof target !== "string" || target.length > 512) return ADMIN_HOME_PATH;
  if (!target.startsWith("/admin")) return ADMIN_HOME_PATH;
  if (target.startsWith("//") || target.includes("\\")) return ADMIN_HOME_PATH;
  if (target.startsWith(ADMIN_LOGIN_PATH)) return ADMIN_HOME_PATH;
  return target;
}
