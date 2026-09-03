"use client";

import { useActionState } from "react";

import {
  refreshMarketingCache,
  type RefreshState,
} from "@/app/admin/(dashboard)/tools/cache-refresh/actions";
import { Button } from "@/components/ui/button";

const initialState: RefreshState = { status: "idle" };

export function RefreshButton() {
  const [state, action, pending] = useActionState(
    refreshMarketingCache,
    initialState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Refreshing…" : "Refresh cached pages"}
      </Button>

      {/* Announced on completion rather than on every keystroke of state. */}
      <p
        role="status"
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-[0.9375rem] font-medium text-cedar-heartwood"
            : "text-[0.9375rem] text-steel-text"
        }
      >
        {state.message ?? ""}
      </p>
    </form>
  );
}
