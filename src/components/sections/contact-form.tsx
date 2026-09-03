"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, controlClasses, describedBy } from "@/components/ui/field";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { contactSchema, type ContactInput, type ContactResponse } from "@/lib/contact-schema";
import { serviceInterests } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      company: "",
      website: "",
      challenge: "",
      serviceInterest: undefined,
    },
  });

  const onSubmit = async (values: ContactInput) => {
    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ContactResponse = await response.json();

      if (!response.ok || !result.ok) {
        // Surface server-side field errors on the matching inputs.
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ContactInput, {
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

      reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError(
        "We could not reach the server. Check your connection and try again.",
      );
    }
  };

  const submitting = status === "submitting";

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-20 bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <TechnicalLabel index="05" tone="light">
              Start here
            </TechnicalLabel>
            <h2
              id="contact-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight"
            >
              Let&rsquo;s find your highest-value move.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-forge-black/70">
              Tell us where growth feels stuck. We&rsquo;ll come to the first
              conversation ready with questions—not a canned pitch.
            </p>
          </div>

          <div className="border border-forge-black/15 bg-workshop-white p-6 sm:p-9">
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-start gap-5 py-6"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-cedar-green/12 text-cedar-ink">
                  <Check aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    Request received.
                  </p>
                  <p className="mt-3 max-w-md leading-relaxed text-forge-black/70">
                    Thanks for the detail. We&rsquo;ll review how your business
                    runs today and follow up from a Cedar Forge address with
                    questions and a suggested first move.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setStatus("idle")}
                  size="sm"
                >
                  Send another request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Live region for submit-level failures. */}
                {formError ? (
                  <p
                    role="alert"
                    className="mb-6 flex items-start gap-3 border border-red-700/30 bg-red-700/[0.06] p-4 text-sm font-medium text-red-800"
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className="mt-px size-4 shrink-0"
                    />
                    {formError}
                  </p>
                ) : null}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="name" label="Name" error={errors.name?.message}>
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={describedBy(
                        "name",
                        Boolean(errors.name),
                        false,
                      )}
                      className={controlClasses(Boolean(errors.name))}
                    />
                  </Field>

                  <Field
                    id="email"
                    label="Work email"
                    error={errors.email?.message}
                  >
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={describedBy(
                        "email",
                        Boolean(errors.email),
                        false,
                      )}
                      className={controlClasses(Boolean(errors.email))}
                    />
                  </Field>

                  <Field
                    id="company"
                    label="Company"
                    error={errors.company?.message}
                  >
                    <input
                      {...register("company")}
                      id="company"
                      type="text"
                      autoComplete="organization"
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={describedBy(
                        "company",
                        Boolean(errors.company),
                        false,
                      )}
                      className={controlClasses(Boolean(errors.company))}
                    />
                  </Field>

                  <Field
                    id="website"
                    label="Website"
                    optional
                    hint="https://example.com"
                    error={errors.website?.message}
                  >
                    <input
                      {...register("website")}
                      id="website"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://"
                      aria-invalid={Boolean(errors.website)}
                      aria-describedby={describedBy(
                        "website",
                        Boolean(errors.website),
                        true,
                      )}
                      className={controlClasses(Boolean(errors.website))}
                    />
                  </Field>

                  <Field
                    id="serviceInterest"
                    label="Service interest"
                    error={errors.serviceInterest?.message}
                    className="sm:col-span-2"
                  >
                    <select
                      {...register("serviceInterest")}
                      id="serviceInterest"
                      defaultValue=""
                      aria-invalid={Boolean(errors.serviceInterest)}
                      aria-describedby={describedBy(
                        "serviceInterest",
                        Boolean(errors.serviceInterest),
                        false,
                      )}
                      className={controlClasses(Boolean(errors.serviceInterest))}
                    >
                      <option value="" disabled>
                        Select an area
                      </option>
                      {serviceInterests.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    id="challenge"
                    label="Primary challenge"
                    hint="What feels stuck right now? A sentence or two is plenty."
                    error={errors.challenge?.message}
                    className="sm:col-span-2"
                  >
                    <textarea
                      {...register("challenge")}
                      id="challenge"
                      rows={5}
                      aria-invalid={Boolean(errors.challenge)}
                      aria-describedby={describedBy(
                        "challenge",
                        Boolean(errors.challenge),
                        true,
                      )}
                      className={`${controlClasses(Boolean(errors.challenge))} resize-y`}
                    />
                  </Field>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                    className="group w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Sending
                      </>
                    ) : (
                      <>
                        Build My Growth Map
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </Button>
                  <p className="text-[0.8125rem] leading-snug text-forge-black/55">
                    We reply from a Cedar Forge address. No newsletter, no list.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
