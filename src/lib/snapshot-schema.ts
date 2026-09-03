import { z } from "zod";

import { snapshotFocusOptions } from "@/lib/site";

const focusValues = snapshotFocusOptions.map((option) => option.value) as [
  string,
  ...string[],
];

/**
 * Validation for the free Systems Snapshot request. Imported by the popup form
 * and by the route handler so the browser and server enforce the same rules.
 *
 * This is deliberately shorter than `contactSchema`: the Snapshot costs nothing,
 * so it asks for nothing beyond what is needed to reply and prepare. Budget and
 * the long "where is growth stuck" answer belong to the paid Growth Systems Map
 * request, not here.
 */
export const snapshotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is longer than we can store."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your work email.")
    .max(160, "That email is longer than we can store.")
    .pipe(z.email("Please enter a valid email address.")),
  company: z
    .string()
    .trim()
    .min(2, "Please enter your company.")
    .max(120, "That company name is longer than we can store."),
  website: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .pipe(z.url("Include the full URL, starting with https://")),
    ])
    .optional()
    .transform((value) => (value ? value : undefined)),
  focusArea: z
    .union([z.literal(""), z.enum(focusValues)])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type SnapshotInput = z.input<typeof snapshotSchema>;
export type SnapshotPayload = z.output<typeof snapshotSchema>;

/** Shape returned by POST /api/snapshot. */
export type SnapshotResponse = {
  ok: boolean;
  message: string;
  /** Field-level errors, keyed by form field name. */
  fieldErrors?: Partial<Record<keyof SnapshotPayload, string>>;
  /** True when no provider is wired up and the lead was only logged. */
  delivered?: boolean;
};
