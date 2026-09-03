import type { NextRequest } from "next/server";

import {
  isHubSpotSnapshotFormConfigured,
  submitSnapshotToHubSpotForm,
} from "@/lib/hubspot-forms";
import { createRateLimiter, deliverLead } from "@/lib/lead-delivery";
import { snapshotFocusOptions, systemsSnapshot } from "@/lib/site";
import {
  snapshotSchema,
  type SnapshotPayload,
  type SnapshotResponse,
} from "@/lib/snapshot-schema";

/**
 * Free Systems Snapshot intake.
 *
 * Separate from /api/contact because the offers are different: this one is free
 * and asks for the minimum, the Growth Map request asks for scope and budget.
 * Keeping the routes apart means either can change without loosening the other's
 * validation. Delivery is shared through `deliverLead`.
 */

const isRateLimited = createRateLimiter({ windowMs: 60_000, max: 5 });

function labelFor(value: string | undefined) {
  if (!value) return "Not answered";
  return (
    snapshotFocusOptions.find((option) => option.value === value)?.label ?? value
  );
}

function summarize(payload: SnapshotPayload) {
  return [
    `Requested: ${systemsSnapshot.name} (free, 15 minutes)`,
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company: ${payload.company}`,
    `Website: ${payload.website ?? "—"}`,
    `What feels most stuck: ${labelFor(payload.focusArea)}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      {
        ok: false,
        message: "Too many requests. Please wait a moment and try again.",
      } satisfies SnapshotResponse,
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Invalid request body.",
      } satisfies SnapshotResponse,
      { status: 400 },
    );
  }

  const parsed = snapshotSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: SnapshotResponse["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof SnapshotPayload] = issue.message;
      }
    }

    return Response.json(
      {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      } satisfies SnapshotResponse,
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const hubspotContext = {
    // Set by the HubSpot tracking script; links the lead to its first visit.
    hutk: request.cookies.get("hubspotutk")?.value,
    pageUri: request.headers.get("referer") ?? undefined,
  };

  try {
    const { delivered } = await deliverLead({
      channel: "snapshot",
      subject: `Systems Snapshot request — ${payload.company}`,
      replyTo: payload.email,
      summary: summarize(payload),
      webhookPayload: {
        ...payload,
        intent: systemsSnapshot.id,
        source: "cedarforge.ai/systems-snapshot",
      },
      crm: isHubSpotSnapshotFormConfigured()
        ? () => submitSnapshotToHubSpotForm(payload, hubspotContext)
        : undefined,
    });

    return Response.json(
      {
        ok: true,
        delivered,
        message: delivered
          ? "Thanks. Your Snapshot request is on its way."
          : "Received. No delivery provider is configured yet, so this was logged on the server.",
      } satisfies SnapshotResponse,
      { status: 200 },
    );
  } catch (error) {
    // Log detail server-side, return something safe to the client.
    console.error("[snapshot] Delivery failed:", error);

    return Response.json(
      {
        ok: false,
        message:
          "We could not send your request just now. Please try again shortly.",
      } satisfies SnapshotResponse,
      { status: 502 },
    );
  }
}
