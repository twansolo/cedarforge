/**
 * Data assembly for the admin Leads tool.
 *
 * Fetches a window of recent contacts from HubSpot, classifies each against the
 * target verticals, then segments and filters in memory.
 *
 * ── Why filter here and not in HubSpot ──────────────────────────────────────
 * The vertical does not exist as a property in the CRM — it is derived from the
 * company name and website by src/lib/leads/classify.ts. HubSpot cannot filter
 * on something it does not store, so the segmenting has to happen after the
 * fetch. That has one honest consequence worth stating plainly in the UI: the
 * counts describe the scanned window, not the entire portal. `scanned` and
 * `totalInPortal` are both returned so the tool can say so.
 *
 * The free-text box is the exception: it is passed through to HubSpot's own
 * search, which does index name, email, company, and phone.
 */

import { hubspot } from "@/lib/site";
import {
  classifyContact,
  type LeadClassification,
} from "@/lib/leads/classify";
import { targetMarkets, type TargetMarket } from "@/lib/leads/verticals";
import { searchRecentContacts, type HubSpotContact } from "@/lib/hubspot-crm";

/** Scan window sizes offered in the UI. */
export const SCAN_SIZES = [50, 100, 200, 500] as const;
export const DEFAULT_SCAN_SIZE = 100;

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  jobTitle: string | null;
  industry: string | null;
  location: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  source: string | null;
  createdAt: string | null;
  /** Deep link to the record in HubSpot, so the CRM stays the system of record. */
  hubspotUrl: string;
  classification: LeadClassification;
};

export type Segment = {
  market: TargetMarket;
  count: number;
  /** Of `count`, how many resolved to a specific vertical. */
  verticalCount: number;
};

export type LeadsView = {
  leads: Lead[];
  /** How many contacts were pulled and classified. */
  scanned: number;
  /** Total contacts matching the search in HubSpot, which may be far larger. */
  totalInPortal: number;
  /** True when the scan window stopped short of the portal total. */
  truncated: boolean;
  segments: Segment[];
  /** Scanned contacts that matched no target market. */
  outsideCount: number;
};

export type LeadsFilter = {
  /** Market id, `"outside"` for the non-target pile, or undefined for all. */
  market?: string;
  vertical?: string;
  query?: string;
  scan?: number;
};

/**
 * HubSpot stores these as internal values. Only the stages we expect to see get
 * a hand-written label; anything else falls back to title case, so a portal with
 * custom stages degrades to something readable rather than showing raw enums.
 */
const LIFECYCLE_LABELS: Record<string, string> = {
  subscriber: "Subscriber",
  lead: "Lead",
  marketingqualifiedlead: "MQL",
  salesqualifiedlead: "SQL",
  opportunity: "Opportunity",
  customer: "Customer",
  evangelist: "Evangelist",
  other: "Other",
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

export function lifecycleLabel(value: string | null) {
  if (!value) return null;
  return LIFECYCLE_LABELS[value.toLowerCase()] ?? titleCase(value);
}

export function sourceLabel(value: string | null) {
  if (!value) return null;
  return titleCase(value);
}

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toLead(contact: HubSpotContact): Lead {
  const properties = contact.properties ?? {};

  const firstName = text(properties.firstname);
  const lastName = text(properties.lastname);
  const email = text(properties.email);
  const city = text(properties.city);
  const state = text(properties.state);

  const name =
    [firstName, lastName].filter(Boolean).join(" ") || email || "Unnamed contact";

  const company = text(properties.company);
  const website = text(properties.website);
  const jobTitle = text(properties.jobtitle);
  const industry = text(properties.industry);
  const message = text(properties.message);

  return {
    id: contact.id,
    name,
    email,
    phone: text(properties.phone),
    company,
    website,
    jobTitle,
    industry,
    location: [city, state].filter(Boolean).join(", ") || null,
    lifecycleStage: text(properties.lifecyclestage),
    leadStatus: text(properties.hs_lead_status),
    source: text(properties.hs_analytics_source),
    createdAt: text(properties.createdate) ?? contact.createdAt ?? null,
    hubspotUrl: `https://app.hubspot.com/contacts/${hubspot.portalId}/contact/${contact.id}`,
    classification: classifyContact({
      company,
      website,
      jobTitle,
      industry,
      message,
      email,
    }),
  };
}

/**
 * Loads and segments the lead list.
 *
 * Throws `HubSpotCrmError` on an API failure so the page can render the reason
 * rather than an empty table that looks like "no leads".
 */
export async function loadLeads(filter: LeadsFilter = {}): Promise<LeadsView> {
  const scan = SCAN_SIZES.includes(filter.scan as (typeof SCAN_SIZES)[number])
    ? (filter.scan as number)
    : DEFAULT_SCAN_SIZE;

  const { contacts, total, truncated } = await searchRecentContacts({
    limit: scan,
    query: filter.query,
  });

  const classified = contacts.map(toLead);

  // Segment counts come from the whole scanned window, before the market and
  // vertical filters are applied, so the summary does not collapse to the
  // filtered view every time the operator drills in.
  const segments: Segment[] = targetMarkets.map((market) => {
    const matching = classified.filter(
      (lead) => lead.classification.market?.id === market.id,
    );

    return {
      market,
      count: matching.length,
      verticalCount: matching.filter((lead) => lead.classification.vertical)
        .length,
    };
  });

  const outsideCount = classified.filter(
    (lead) => !lead.classification.market,
  ).length;

  let leads = classified;

  if (filter.market === "outside") {
    leads = leads.filter((lead) => !lead.classification.market);
  } else if (filter.market) {
    leads = leads.filter(
      (lead) => lead.classification.market?.id === filter.market,
    );
  }

  if (filter.vertical) {
    leads = leads.filter(
      (lead) => lead.classification.vertical?.id === filter.vertical,
    );
  }

  return {
    leads,
    scanned: classified.length,
    totalInPortal: total,
    truncated,
    segments,
    outsideCount,
  };
}
