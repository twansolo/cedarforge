"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClasses, describedBy } from "@/components/ui/field";
import { signIn, type LoginState } from "@/lib/admin/actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);
  const error = state?.error;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {/* Sanitised server-side by safeAdminRedirect before any navigation. */}
      <input type="hidden" name="next" value={next} />

      <Field
        id="admin-password"
        label="Password"
        error={error}
        hint="Single shared operator password for this environment."
      >
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(
            "admin-password",
            Boolean(error),
            true,
          )}
          className={controlClasses(Boolean(error))}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
