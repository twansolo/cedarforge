import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_RESPONSE_HEADERS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_REFRESH_WITHIN_SECONDS,
  sessionCookieOptions,
} from "@/lib/admin/config";
import {
  createSessionToken,
  secondsRemaining,
  verifySessionToken,
} from "@/lib/admin/session-token";

/**
 * Admin gate.
 *
 * This is an optimistic check in the sense the Next docs mean: it reads the
 * signed cookie and nothing else, so it stays cheap enough to run on every
 * admin request, including prefetches. It is the first line, not the only one —
 * `requireAdmin()` in src/lib/admin/dal.ts re-verifies next to the data.
 *
 * Three jobs:
 *   1. Send unauthenticated traffic to the login screen, remembering where it
 *      was headed.
 *   2. Send an already-authenticated operator past the login screen.
 *   3. Stamp no-index / no-store headers on everything under /admin, and slide
 *      the session forward while it is being used.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === ADMIN_LOGIN_PATH;

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session && !isLoginRoute) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.nextUrl);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return withAdminHeaders(NextResponse.redirect(loginUrl));
  }

  if (session && isLoginRoute) {
    return withAdminHeaders(
      NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.nextUrl)),
    );
  }

  const response = withAdminHeaders(NextResponse.next());

  // Sliding expiry: an operator working past the halfway mark gets a fresh
  // cookie, while an idle session still hits its absolute deadline.
  if (session && secondsRemaining(session) < SESSION_REFRESH_WITHIN_SECONDS) {
    const refreshed = await createSessionToken(
      session.sub,
      SESSION_MAX_AGE_SECONDS,
    );

    if (refreshed) {
      response.cookies.set(
        SESSION_COOKIE_NAME,
        refreshed,
        sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
      );
    }
  }

  return response;
}

function withAdminHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

/**
 * Scoped to the admin tree only. The marketing site is fully static and gains
 * nothing from running this on every request.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
