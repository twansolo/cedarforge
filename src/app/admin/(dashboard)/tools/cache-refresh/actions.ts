"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin, AdminAuthError } from "@/lib/admin/dal";

/**
 * Example of a tool that changes state.
 *
 * The pattern to copy: a server action is its own public endpoint, reachable
 * without ever rendering the page that owns it, so it authenticates itself
 * before doing any work.
 */

export type RefreshState = {
  status: "idle" | "done" | "error";
  message?: string;
};

const targets = ["/"] as const;

/**
 * Takes no arguments: `useActionState` passes the previous state and the form
 * data, and this action needs neither. A narrower signature is still assignable.
 */
export async function refreshMarketingCache(): Promise<RefreshState> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return {
        status: "error",
        message: "Your session expired. Reload the page and sign in again.",
      };
    }
    throw error;
  }

  try {
    for (const target of targets) {
      revalidatePath(target);
    }

    return {
      status: "done",
      message: `Rebuilt ${targets.length} path${targets.length === 1 ? "" : "s"} on the next request.`,
    };
  } catch (error) {
    console.error("[admin] Cache refresh failed:", error);
    return {
      status: "error",
      message: "The refresh did not complete. Check the server logs.",
    };
  }
}
