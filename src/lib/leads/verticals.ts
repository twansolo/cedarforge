/**
 * The target market definition for the first six months.
 *
 * Three markets, each with the specific verticals we are actually pitching.
 * This file is the single source of truth for that targeting: the admin Leads
 * tool segments the CRM against it, so narrowing or widening the focus is an
 * edit here rather than a change to the tool.
 *
 * ── How a contact gets placed ────────────────────────────────────────────────
 * HubSpot has no "vertical" concept out of the box. Its default `industry`
 * property is a fixed, coarse enumeration — it can tell you "Construction" but
 * never "Roofing" — and most contacts arrive with it empty anyway. So placement
 * uses two signals, in this order:
 *
 *   1. Keywords, matched against the company name, job title, website, and the
 *      message the lead left. This is the signal that resolves a *vertical*.
 *   2. The `industry` enum, which can only resolve a *market*.
 *
 * See src/lib/leads/classify.ts for the matcher.
 *
 * ── Keyword rules ───────────────────────────────────────────────────────────
 * Keywords are stems, matched at a word boundary on the left and open on the
 * right, so "landscap" catches landscaping, landscape, and landscaper. Prefer a
 * distinctive multi-word or multi-syllable stem over a short one: "law firm"
 * and "attorney" rather than "law", which would drag in every lawn-care company
 * in the pipeline.
 *
 * First match wins, scanned in the order markets and verticals appear below.
 * That matters for the handful of terms two verticals could both claim — a
 * general contractor reads as residential Remodeling here, because Home
 * services is scanned first, while "construction" is left to the commercial
 * Engineering and construction vertical.
 */

export type Vertical = {
  id: string;
  name: string;
  /** Distinctive stems that place a contact in this vertical. */
  keywords: string[];
};

export type TargetMarket = {
  id: string;
  /** Mono index used by the dashboard's section labels. */
  index: string;
  name: string;
  /** One line on why this market earns the next six months. */
  thesis: string;
  /**
   * HubSpot `industry` enum values that place a contact in this market. A
   * coarse fallback only: it never resolves a vertical. Values are compared
   * after normalising to upper snake case, so a portal using slightly different
   * casing still matches; an unrecognised value simply fails to match and
   * leaves the contact to the keyword pass.
   */
  industries: string[];
  verticals: Vertical[];
};

export const targetMarkets: TargetMarket[] = [
  {
    id: "home-services",
    index: "01",
    name: "Home services",
    thesis:
      "Urgent, high-ticket jobs where a missed call is a lost job. Lead capture and follow-up pay for themselves fastest here.",
    industries: [
      "CONSTRUCTION",
      "CONSUMER_SERVICES",
      "BUILDING_MATERIALS",
      "ENVIRONMENTAL_SERVICES",
      "FACILITIES_SERVICES",
    ],
    verticals: [
      {
        id: "hvac",
        name: "HVAC",
        keywords: [
          "hvac",
          "heating",
          "cooling",
          "air conditioning",
          "furnace",
          "refrigeration",
          "geothermal",
          "boiler",
        ],
      },
      {
        id: "roofing",
        name: "Roofing",
        keywords: [
          "roof",
          "siding",
          "gutter",
          "exteriors",
          "storm restoration",
          "shingle",
        ],
      },
      {
        id: "plumbing",
        name: "Plumbing",
        keywords: [
          "plumb",
          "drain",
          "sewer",
          "water heater",
          "septic",
          "backflow",
        ],
      },
      {
        id: "electrical",
        name: "Electrical",
        keywords: ["electric", "wiring", "low voltage", "generator"],
      },
      {
        id: "remodeling",
        name: "Remodeling",
        keywords: [
          "remodel",
          "renovation",
          "kitchen and bath",
          "cabinetry",
          "countertop",
          "flooring",
          "general contractor",
          "custom home",
          "design build",
          "handyman",
        ],
      },
      {
        id: "landscaping",
        name: "Landscaping",
        keywords: [
          "landscap",
          "lawn",
          "tree service",
          "irrigation",
          "hardscape",
          "snow removal",
          "sprinkler",
          "turf",
        ],
      },
    ],
  },
  {
    id: "clinics-practices",
    index: "02",
    name: "Clinics and practices",
    thesis:
      "Recurring patient demand against a tight schedule. Intake, reminders, and local search decide who fills the calendar.",
    industries: [
      "MEDICAL_PRACTICE",
      "HEALTH_WELLNESS_AND_FITNESS",
      "HOSPITAL_HEALTH_CARE",
      "MENTAL_HEALTH_CARE",
      "ALTERNATIVE_MEDICINE",
    ],
    verticals: [
      {
        id: "chiropractic",
        name: "Chiropractic",
        keywords: ["chiro", "spine center", "spinal care"],
      },
      {
        id: "dental",
        name: "Dental",
        keywords: [
          "dental",
          "dentist",
          "orthodont",
          "endodont",
          "periodont",
          "oral surgery",
          "dds",
        ],
      },
      {
        id: "med-spa",
        name: "Med spas",
        keywords: [
          "med spa",
          "medspa",
          "aesthetic",
          "botox",
          "dermatolog",
          "laser clinic",
          "injectable",
        ],
      },
      {
        id: "physical-therapy",
        name: "Physical therapy",
        keywords: [
          "physical therapy",
          "physiotherapy",
          "rehab",
          "sports medicine",
          "occupational therapy",
          "orthoped",
        ],
      },
      {
        id: "mental-health",
        name: "Mental health",
        keywords: [
          "counseling",
          "psycholog",
          "psychiatr",
          "behavioral health",
          "mental health",
          "lcsw",
          "lpc ",
        ],
      },
    ],
  },
  {
    id: "professional-services",
    index: "03",
    name: "Professional services",
    thesis:
      "Referral-led firms with real deal value and almost no marketing system. Positioning and pipeline automation move the needle.",
    industries: [
      "ACCOUNTING",
      "LEGAL_SERVICES",
      "LAW_PRACTICE",
      "INSURANCE",
      "FINANCIAL_SERVICES",
      "REAL_ESTATE",
      "COMMERCIAL_REAL_ESTATE",
      "CIVIL_ENGINEERING",
      "ARCHITECTURE_PLANNING",
      "MECHANICAL_OR_INDUSTRIAL_ENGINEERING",
    ],
    verticals: [
      {
        id: "accounting",
        name: "Accounting",
        keywords: [
          "accounting",
          "accountant",
          "cpa",
          "bookkeep",
          "tax service",
          "tax prep",
          "tax advis",
          "payroll service",
        ],
      },
      {
        id: "insurance",
        name: "Insurance",
        keywords: [
          "insurance",
          "risk management",
          "underwrit",
          "benefits advis",
        ],
      },
      {
        id: "legal",
        name: "Law firms",
        keywords: [
          "law firm",
          "law office",
          "law group",
          "attorney",
          "lawyer",
          "legal",
          "litigation",
          "paralegal",
        ],
      },
      {
        id: "commercial-real-estate",
        name: "Commercial real estate",
        keywords: [
          "real estate",
          "realty",
          "commercial property",
          "property management",
          "brokerage",
          "leasing group",
        ],
      },
      {
        id: "engineering-construction",
        name: "Engineering and construction",
        keywords: [
          "engineering",
          "engineers",
          "surveying",
          "architect",
          "construction",
          "structural",
          "geotechnical",
        ],
      },
    ],
  },
];

/** Every vertical, paired with the market that owns it. */
export const allVerticals: Array<{ market: TargetMarket; vertical: Vertical }> =
  targetMarkets.flatMap((market) =>
    market.verticals.map((vertical) => ({ market, vertical })),
  );

export function findMarket(id: string | undefined): TargetMarket | undefined {
  return id ? targetMarkets.find((market) => market.id === id) : undefined;
}

export function findVertical(id: string | undefined) {
  return id ? allVerticals.find((entry) => entry.vertical.id === id) : undefined;
}
