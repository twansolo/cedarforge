"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, controlClasses, describedBy } from "@/components/ui/field";
import { snapshotFocusOptions, systemsSnapshot } from "@/lib/site";
import {
  snapshotSchema,
  type SnapshotInput,
  type SnapshotResponse,
} from "@/lib/snapshot-schema";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Free Systems Snapshot request.
 *
 * Shorter than the Growth Map form on purpose: three required fields, an
 * optional website, and one optional routing question. Field ids are prefixed
 * because this form and the contact form share a page.
 */
export function SnapshotForm({
  onSuccess,
  onDone,
}: {
  /** Called once the lead is accepted, so the popup can stop reappearing. */
  onSuccess?: () => void;
  /** Dismisses the popup from the confirmation state. */
  onDone?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SnapshotInput>({
    resolver: zodResolver(snapshotSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      company: "",
      website: "",
      focusArea: "",
    },
  });

  const onSubmit = async (values: SnapshotInput) => {
    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: SnapshotResponse = await response.json();

      if (!response.ok || !result.ok) {
        // Surface server-side field errors on the matching inputs.
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof SnapshotInput, {
              type: "server",
              message,
            });
          }
        }
        setStatus("error");
        setFormError(
          result.message ?? "Something went wrong. Please try again.",
        );
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setStatus("error");
      setFormError(
        "We could not reach the server. Check your connection and try again.",
      );
    }
  };

  const submitting = status === "submitting";

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-start gap-5"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-cedar-green/12 text-cedar-ink">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold tracking-tight">
            Your Snapshot is requested.
          </p>
          <p className="mt-3 leading-relaxed text-forge-black/70">
            We&rsquo;ll reply within one business day with a couple of times that
            fit. Fifteen minutes, three findings, no invoice.
          </p>
        </div>
        {onDone ? (
          <Button variant="ghost" size="sm" onClick={onDone}>
            Back to the site
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="text-xl font-bold tracking-tight">
        {systemsSnapshot.formHeading}
      </p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-forge-black/65">
        {systemsSnapshot.formIntro}
      </p>

      {/* Live region for submit-level failures. */}
      {formError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 border border-red-700/30 bg-red-700/[0.06] p-4 text-sm font-medium text-red-800"
        >
          <AlertTriangle aria-hidden="true" className="mt-px size-4 shrink-0" />
          {formError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          id="snapshot-name"
          label="Name"
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <input
            {...register("name")}
            id="snapshot-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy(
              "snapshot-name",
              Boolean(errors.name),
              false,
            )}
            className={controlClasses(Boolean(errors.name))}
          />
        </Field>

        <Field
          id="snapshot-email"
          label="Work email"
          error={errors.email?.message}
        >
          <input
            {...register("email")}
            id="snapshot-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy(
              "snapshot-email",
              Boolean(errors.email),
              false,
            )}
            className={controlClasses(Boolean(errors.email))}
          />
        </Field>

        <Field
          id="snapshot-company"
          label="Company"
          error={errors.company?.message}
        >
          <input
            {...register("company")}
            id="snapshot-company"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            aria-describedby={describedBy(
              "snapshot-company",
              Boolean(errors.company),
              false,
            )}
            className={controlClasses(Boolean(errors.company))}
          />
        </Field>

        <Field
          id="snapshot-website"
          label="Website"
          optional
          hint="So we can look before the call."
          error={errors.website?.message}
        >
          <input
            {...register("website")}
            id="snapshot-website"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            aria-invalid={Boolean(errors.website)}
            aria-describedby={describedBy(
              "snapshot-website",
              Boolean(errors.website),
              true,
            )}
            className={controlClasses(Boolean(errors.website))}
          />
        </Field>

        <Field
          id="snapshot-focus"
          label="What feels most stuck?"
          optional
          error={errors.focusArea?.message}
        >
          <select
            {...register("focusArea")}
            id="snapshot-focus"
            aria-invalid={Boolean(errors.focusArea)}
            aria-describedby={describedBy(
              "snapshot-focus",
              Boolean(errors.focusArea),
              false,
            )}
            className={controlClasses(Boolean(errors.focusArea))}
          >
            <option value="">Skip this</option>
            {snapshotFocusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="group mt-7 w-full"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Sending
          </>
        ) : (
          <>
            {systemsSnapshot.ctaLabel}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </>
        )}
      </Button>

      <p className="mt-4 text-[0.8125rem] leading-snug text-forge-black/55">
        {systemsSnapshot.privacyNote}
      </p>
    </form>
  );
}
