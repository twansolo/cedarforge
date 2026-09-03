import type { ContactPayload } from "@/lib/contact-schema";
import { hubspot, investmentOptions, solutionOptions } from "@/lib/site";

/**
 * HubSpot Forms submission.
 *
 * ── Why this and not a webhook ───────────────────────────────────────────────
 * HubSpot's "send a webhook" workflow action is an *outbound* call from HubSpot
 * and needs Operations Hub Professional. What we want is the opposite direction:
 * an endpoint that accepts a POST from this site. The Forms submission endpoint
 * does that and is available on the free tier, so no paid hub is required.
 *
 * Unlike the generic CONTACT_WEBHOOK_URL path, this cannot take our flat payload
 * as-is: HubSpot expects `fields` as name/value pairs and validates every field
 * name against the form definition in the portal. Hence the explicit mapping
 * below.
 *
 * ── Field mapping ────────────────────────────────────────────────────────────
 * Only default contact properties are used, so nothing here depends on creating
 * custom properties. `solution` and `investmentRange` have no default property
 * to live in, so they are prepended to the message body rather than dropped. If
 * you later create custom properties in HubSpot, move them out of `message` and
 * into their own entries and add matching fields to the form.
 *
 * The HubSpot form must contain exactly these fields:
 *   firstname, lastname, email, company, website, message
 */

type SubmissionContext = {
  /** Value of the `hubspotutk` cookie, when the visitor has been tracked. */
  hutk?: string;
  /** Page the submission came from, used for source attribution. */
  pageUri?: string;
};

/** Human-readable label for a stored option value, falling back to the value. */
function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * HubSpot stores first and last name separately; the form asks for one name.
 * Everything after the first space becomes the last name, which handles
 * multi-word surnames better than splitting on every space. A single-word name
 * leaves `lastname` empty rather than duplicating the first name.
 */
function splitName(name: string) {
  const [firstname, ...rest] = name.split(/\s+/);
  return { firstname: firstname ?? name, lastname: rest.join(" ") };
}

export function isHubSpotFormConfigured() {
  return Boolean(process.env.HUBSPOT_FORM_GUID);
}

/**
 * Sends one lead to HubSpot. Throws on a non-2xx response so the caller can
 * decide whether the whole submission failed.
 */
export async function submitToHubSpotForm(
  payload: ContactPayload,
  context: SubmissionContext = {},
) {
  const formGuid = process.env.HUBSPOT_FORM_GUID;

  if (!formGuid) {
    throw new Error("HUBSPOT_FORM_GUID is not set");
  }

  const { firstname, lastname } = splitName(payload.name);

  const message = [
    `Solution considered: ${labelFor(solutionOptions, payload.solution)}`,
    `Investment range: ${labelFor(investmentOptions, payload.investmentRange)}`,
    "",
    "Where growth is getting stuck:",
    payload.challenge,
  ].join("\n");

  const fields = [
    { name: "firstname", value: firstname },
    { name: "lastname", value: lastname },
    { name: "email", value: payload.email },
    { name: "company", value: payload.company },
    { name: "website", value: payload.website ?? "" },
    { name: "message", value: message },
  ].filter((field) => field.value !== "");

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${hubspot.portalId}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        /*
         * `hutk` links this submission to the visitor's tracked session from the
         * HubSpot script, which is what lets HubSpot attribute the lead to an
         * original source instead of "Offline sources". It is omitted when the
         * cookie is absent, for example if the visitor declined tracking.
         */
        context: {
          ...(context.hutk ? { hutk: context.hutk } : {}),
          ...(context.pageUri ? { pageUri: context.pageUri } : {}),
          pageName: "Cedar Forge.AI — Contact",
        },
      }),
    },
  );

  if (!response.ok) {
    // HubSpot returns useful validation detail here; keep it server-side only.
    const detail = await response.text().catch(() => "");
    throw new Error(
      `HubSpot form submission responded ${response.status}: ${detail.slice(0, 500)}`,
    );
  }
}
