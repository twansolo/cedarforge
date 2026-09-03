"use server";

/**
 * Sign-in and sign-out.
 *
 * These are server actions rather than a POST route handler on purpose: Next
 * validates the Origin against the Host on every action request, which gives
 * CSRF protection for free. The session cookie is also SameSite=Lax, so it is
 * not attached to cross-site form posts in the first place.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH, safeAdminRedirect } from "@/lib/admin/config";
import { isAdminConfigured, verifyAdminPassword } from "@/lib/admin/password";
import {
  clearLoginAttempts,
  registerLoginAttempt,
} from "@/lib/admin/rate-limit";
import { endAdminSession, startAdminSession } from "@/lib/admin/session";

export type LoginState = {
  error?: string;
};

/** Best-effort client identity for throttling. */
async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip") || "unknown";
}

export async function signIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  const next = safeAdminRedirect(formData.get("next"));

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter your password." };
  }

  // Cap the input before it reaches scrypt so a huge body cannot be used to
  // burn CPU.
  if (password.length > 256) {
    return { error: "Incorrect password." };
  }

  if (!isAdminConfigured()) {
    // Detail is logged server-side by the verifier; the screen stays vague.
    return {
      error:
        "The admin area is not configured on this environment yet. Check the server logs.",
    };
  }

  const attempt = registerLoginAttempt(await clientKey());
  if (!attempt.allowed) {
    const minutes = Math.ceil(attempt.retryAfterSeconds / 60);
    return {
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  const started = await startAdminSession();
  if (!started) {
    return {
      error: "Could not start a session. Check the server logs.",
    };
  }

  clearLoginAttempts(await clientKey());

  // `redirect` signals by throwing, so it stays outside any try/catch above.
  redirect(next);
}

export async function signOut(): Promise<void> {
  await endAdminSession();
  redirect(ADMIN_LOGIN_PATH);
}
