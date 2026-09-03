import { z } from "zod";

import { serviceInterests } from "@/lib/site";

const serviceValues = serviceInterests.map((option) => option.value) as [
  string,
  ...string[],
];

/**
 * Single source of truth for contact validation. Imported by the client form
 * and by the route handler so the browser and server enforce the same rules.
 */
export const contactSchema = z.object({
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
    .union([z.literal(""), z.string().trim().pipe(z.url("Include the full URL, starting with https://"))])
    .optional()
    .transform((value) => (value ? value : undefined)),
  challenge: z
    .string()
    .trim()
    .min(20, "A sentence or two helps us prepare. Please add a little more.")
    .max(2000, "Please keep this under 2000 characters."),
  serviceInterest: z.enum(serviceValues, {
    message: "Please choose the area you are most interested in.",
  }),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactPayload = z.output<typeof contactSchema>;

/** Shape returned by POST /api/contact. */
export type ContactResponse = {
  ok: boolean;
  message: string;
  /** Field-level errors, keyed by form field name. */
  fieldErrors?: Partial<Record<keyof ContactPayload, string>>;
  /** True when no provider is wired up and the lead was only logged. */
  delivered?: boolean;
};
