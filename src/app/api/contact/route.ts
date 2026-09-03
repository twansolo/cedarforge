import type { NextRequest } from "next/server";

import {
  contactSchema,
  type ContactPayload,
  type ContactResponse,
} from "@/lib/contact-schema";

/**
 * Contact intake.
 *
 * Validation runs here with the same Zod schema the client uses, so a crafted
 * request cannot bypass the browser's checks.
 *
 * ── Where the integration belongs ────────────────────────────────────────────
 * `deliverLead` below is the single seam for delivery. Configure one of these
 * in your Vercel project settings (see .env.example); all are server-only and
 * never reach the client bundle:
 *
 *   RESEND_API_KEY + CONTACT_TO_EMAIL + CONTACT_FROM_EMAIL
 *     Transactional email via Resend.
 *   CONTACT_WEBHOOK_URL
 *     Generic JSON POST for a CRM, HubSpot workflow, Zapier, or Make scenario.
 *
 * With nothing configured the route validates, logs, and returns a safe
 * development response so the form is fully testable before a provider exists.
 */

type DeliveryResult = { delivered: boolean };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

/**
 * Best-effort throttle. This lives in instance memory, so it only slows abuse
 * against a single serverless instance. For real protection put a durable store
 * (Upstash Redis, Vercel KV) or the platform's WAF in front of this.
 */
const hits = new Map<string, { count: number; expires: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.expires < now) {
    hits.set(key, { count: 1, expires: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

async function deliverLead(payload: ContactPayload): Promise<DeliveryResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  const summary = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company: ${payload.company}`,
    `Website: ${payload.website ?? "—"}`,
    `Service interest: ${payload.serviceInterest}`,
    "",
    "Primary challenge:",
    payload.challenge,
  ].join("\n");

  if (resendKey && toEmail && fromEmail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: payload.email,
        subject: `Growth Map request — ${payload.company}`,
        text: summary,
      }),
    });

    if (!response.ok) {
      // Body may contain provider detail; keep it out of the client response.
      throw new Error(`Resend responded ${response.status}`);
    }

    return { delivered: true };
  }

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "cedarforge.ai/contact" }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded ${response.status}`);
    }

    return { delivered: true };
  }

  // No provider configured: log for local development, do not pretend to send.
  console.warn(
    "[contact] No delivery provider configured. Lead was validated but not sent.",
  );
  if (process.env.NODE_ENV !== "production") {
    console.info(`[contact] Lead received:\n${summary}`);
  }

  return { delivered: false };
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      {
        ok: false,
        message: "Too many requests. Please wait a moment and try again.",
      } satisfies ContactResponse,
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "Invalid request body." } satisfies ContactResponse,
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: ContactResponse["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof ContactPayload] = issue.message;
      }
    }

    return Response.json(
      {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      } satisfies ContactResponse,
      { status: 400 },
    );
  }

  try {
    const { delivered } = await deliverLead(parsed.data);

    return Response.json(
      {
        ok: true,
        delivered,
        message: delivered
          ? "Thanks. Your request is on its way."
          : "Received. No delivery provider is configured yet, so this was logged on the server.",
      } satisfies ContactResponse,
      { status: 200 },
    );
  } catch (error) {
    // Log detail server-side, return something safe to the client.
    console.error("[contact] Delivery failed:", error);

    return Response.json(
      {
        ok: false,
        message:
          "We could not send your request just now. Please try again shortly.",
      } satisfies ContactResponse,
      { status: 502 },
    );
  }
}
