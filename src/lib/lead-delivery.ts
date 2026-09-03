/**
 * Shared lead delivery.
 *
 * Both intake routes (`/api/contact` and `/api/snapshot`) hand their validated
 * payload to `deliverLead`, so there is a single seam where delivery is wired
 * up and a single place to add a provider.
 *
 * Configure these in your Vercel project settings (see .env.example); all are
 * server-only and never reach the client bundle:
 *
 *   HUBSPOT_FORM_GUID / HUBSPOT_SNAPSHOT_FORM_GUID
 *     Creates the contact in HubSpot via the Forms API. Works on the free tier.
 *     Passed in as the `crm` step by the caller, because the field mapping
 *     differs per form.
 *   RESEND_API_KEY + CONTACT_TO_EMAIL + CONTACT_FROM_EMAIL
 *     Transactional email via Resend.
 *   CONTACT_WEBHOOK_URL
 *     Generic JSON POST for another CRM, Zapier, or Make scenario.
 *
 * The CRM step runs independently of the other two: it should hold every lead
 * even when an email or webhook is also configured. Resend and the generic
 * webhook remain mutually exclusive, in that order.
 *
 * With nothing configured the caller still validates, and this logs and reports
 * an undelivered result, so a form is fully testable before a provider exists.
 */

export type DeliveryResult = { delivered: boolean };

type DeliveryOptions = {
  /** Short name used in server logs, e.g. "contact" or "snapshot". */
  channel: string;
  /** Subject line for the transactional email. */
  subject: string;
  /** Address replies should go to. */
  replyTo: string;
  /** Plain-text body, reused by the email and the development log. */
  summary: string;
  /** Body posted to CONTACT_WEBHOOK_URL. */
  webhookPayload: Record<string, unknown>;
  /**
   * CRM write. Runs first and independently of email and webhook. Throwing here
   * fails the whole delivery, so the caller can report the failure rather than
   * silently losing the lead.
   */
  crm?: () => Promise<void>;
};

/**
 * Best-effort throttle. This lives in instance memory, so it only slows abuse
 * against a single serverless instance. For real protection put a durable store
 * (Upstash Redis, Vercel KV) or the platform's WAF in front of this.
 */
export function createRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}) {
  const hits = new Map<string, { count: number; expires: number }>();

  return function isRateLimited(key: string) {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.expires < now) {
      hits.set(key, { count: 1, expires: now + windowMs });
      return false;
    }

    entry.count += 1;
    return entry.count > max;
  };
}

export async function deliverLead({
  channel,
  subject,
  replyTo,
  summary,
  webhookPayload,
  crm,
}: DeliveryOptions): Promise<DeliveryResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  let delivered = false;

  if (crm) {
    await crm();
    delivered = true;
  }

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
        reply_to: replyTo,
        subject,
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
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded ${response.status}`);
    }

    return { delivered: true };
  }

  if (delivered) {
    return { delivered: true };
  }

  // No provider configured: log for local development, do not pretend to send.
  console.warn(
    `[${channel}] No delivery provider configured. Lead was validated but not sent.`,
  );
  if (process.env.NODE_ENV !== "production") {
    console.info(`[${channel}] Lead received:\n${summary}`);
  }

  return { delivered: false };
}
