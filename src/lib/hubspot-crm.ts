/**
 * HubSpot CRM reads, for the admin Leads tool.
 *
 * ── Why this is separate from hubspot-forms.ts ───────────────────────────────
 * That file writes one lead in, using the Forms API, which needs no credential
 * beyond a public portal id and a form guid. This file reads the CRM back out,
 * which is a different API with a different auth model: a private app access
 * token sent as a bearer credential.
 *
 * Server-only. The token is read from the environment at call time and never
 * returned, logged, or embedded in a message that reaches the browser. Import
 * this from server components and server actions only — it must never end up in
 * a module a client component pulls in.
 *
 * ── Setup, in HubSpot ───────────────────────────────────────────────────────
 *   1. Settings → Integrations → Private Apps → Create a private app.
 *   2. Scopes tab → enable `crm.objects.contacts.read`. Nothing else is needed;
 *      this file only reads, and a token without write scopes cannot damage the
 *      CRM even if it leaks.
 *   3. Copy the access token into HUBSPOT_PRIVATE_APP_TOKEN.
 *
 * Private app tokens are available on the free tier.
 */

const API_BASE = "https://api.hubapi.com";

/** Search caps out at 100 records per request. */
const PAGE_SIZE = 100;

/** Ceiling on the paging loop, so a bad `limit` cannot walk the whole portal. */
const MAX_PAGES = 10;

export function isHubSpotCrmConfigured() {
  return Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim());
}

/**
 * A failed HubSpot call, carrying the status so callers can tell a
 * misconfiguration from an outage and say something useful about it.
 */
export class HubSpotCrmError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HubSpotCrmError";
  }

  /** Operator-facing explanation. Safe to render: contains no credential. */
  get operatorMessage() {
    switch (this.status) {
      case 401:
        return "HubSpot rejected the access token. It may have been rotated or deleted in the private app settings.";
      case 403:
        return "The token is valid but missing the crm.objects.contacts.read scope. Add it to the private app, then copy the regenerated token.";
      case 429:
        return "HubSpot rate-limited the request. Wait a moment and try a smaller scan window.";
      default:
        return `HubSpot responded ${this.status}. Check the server logs for detail.`;
    }
  }
}

/**
 * Contact properties requested from HubSpot.
 *
 * All defaults, so this works against a portal with no custom properties. The
 * list is explicit because HubSpot returns only what you ask for — omitting a
 * property here means it silently arrives empty rather than erroring.
 */
const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "company",
  "website",
  "jobtitle",
  "industry",
  "city",
  "state",
  "lifecyclestage",
  "hs_lead_status",
  "message",
  "hs_analytics_source",
  "createdate",
  "lastmodifieddate",
] as const;

type HubSpotContact = {
  id: string;
  properties: Partial<Record<(typeof CONTACT_PROPERTIES)[number], string | null>>;
  createdAt?: string;
  updatedAt?: string;
};

type SearchResponse = {
  total?: number;
  results?: HubSpotContact[];
  paging?: { next?: { after?: string } };
};

async function hubspotPost<T>(path: string, body: unknown): Promise<T> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();

  if (!token) {
    throw new HubSpotCrmError(0, "HUBSPOT_PRIVATE_APP_TOKEN is not set");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    /*
     * Never cached. This is an authenticated read of live CRM data behind an
     * admin session: a cached copy would be both stale and shared, and the
     * response is not something to keep on disk.
     */
    cache: "no-store",
  });

  if (!response.ok) {
    // HubSpot puts useful validation detail in the body. Truncated and kept
    // server-side; the operator sees `operatorMessage` instead.
    const detail = await response.text().catch(() => "");
    throw new HubSpotCrmError(
      response.status,
      `HubSpot CRM ${path} responded ${response.status}: ${detail.slice(0, 500)}`,
    );
  }

  return (await response.json()) as T;
}

export type ContactSearchOptions = {
  /** Free-text search across name, email, company, and phone. */
  query?: string;
  /** How many contacts to pull, newest first. Rounded up to whole pages. */
  limit?: number;
};

export type ContactSearchResult = {
  contacts: HubSpotContact[];
  /** Total matching contacts in the portal, which may exceed what was pulled. */
  total: number;
  /** True when HubSpot had more pages left when the limit was reached. */
  truncated: boolean;
};

/**
 * Pulls the most recently created contacts, newest first.
 *
 * Pages are walked sequentially rather than in parallel: the search endpoint is
 * rate-limited per second, and fanning out four requests at once is the fastest
 * way to get a 429 in exchange for no real latency win on a page this size.
 */
export async function searchRecentContacts(
  options: ContactSearchOptions = {},
): Promise<ContactSearchResult> {
  const limit = Math.max(1, Math.min(options.limit ?? PAGE_SIZE, 1000));
  const query = options.query?.trim();

  const contacts: HubSpotContact[] = [];
  let after: string | undefined;
  let total = 0;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const remaining = limit - contacts.length;
    if (remaining <= 0) break;

    const payload = await hubspotPost<SearchResponse>(
      "/crm/v3/objects/contacts/search",
      {
        limit: Math.min(remaining, PAGE_SIZE),
        properties: [...CONTACT_PROPERTIES],
        sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
        ...(query ? { query } : {}),
        ...(after ? { after } : {}),
      },
    );

    total = payload.total ?? total;
    contacts.push(...(payload.results ?? []));

    after = payload.paging?.next?.after;
    if (!after) break;

    if (contacts.length >= limit) {
      truncated = true;
      break;
    }
  }

  return { contacts, total: total || contacts.length, truncated };
}

export type { HubSpotContact };
