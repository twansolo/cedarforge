export const siteConfig = {
  name: "Cedar Forge.AI",
  legalName: "Cedar Forge.AI",
  tagline: "Intelligent Growth Systems",
  domain: "cedarforge.ai",
  url: "https://cedarforge.ai",
  locality: "Cedar Rapids",
  region: "IA",
  regionName: "Iowa",
  country: "US",
  title: "Cedar Forge.AI | Intelligent Growth Systems",
  description:
    "Cedar Forge builds growth systems for service businesses in Cedar Rapids and across Iowa: AI workflow automation, conversion-focused web design, and local SEO connected into one operation.",
  socialCard: "/Cedar-Forge-Social-Card.png",
} as const;

/**
 * HubSpot tracking code identifiers, taken from Settings -> Tracking Code in
 * HubSpot. Both values are public: they appear in the script URL that the
 * browser requests on every page, so there is nothing to protect here.
 *
 * `region` is the data centre prefix in that URL (js-<region>.hs-scripts.com).
 * Loading is gated in src/components/analytics/hubspot.tsx.
 */
export const hubspot = {
  portalId: "247271497",
  region: "na2",
} as const;

/**
 * In-page anchors. These become routes when the site expands past one page.
 *
 * "Solutions" and "Pricing" intentionally resolve to the same section: the
 * offer listing is where both the solutions and their investment live, and the
 * spec fixes that section's id as `pricing`. Only one entry carries `activeId`
 * so the scroll indicator highlights a single item.
 */
export const navigation = [
  { href: "#what-we-build", label: "What We Build", activeId: "what-we-build" },
  { href: "#pricing", label: "Solutions" },
  { href: "#how-it-works", label: "How It Works", activeId: "how-it-works" },
  { href: "#pricing", label: "Pricing", activeId: "pricing" },
  {
    href: "#why-cedar-forge",
    label: "Why Cedar Forge",
    activeId: "why-cedar-forge",
  },
] as const;

export const primaryCta = {
  href: "#contact",
  label: "Get Your Growth Map",
} as const;

/** Qualifying line shown beside the hero CTA. */
export const heroPriceNote = "Strategy engagements begin at $1,500.";

/* -------------------------------------------------------------------------- */
/* The offer system                                                            */
/* -------------------------------------------------------------------------- */

export type ProgressionStage = {
  index: string;
  name: string;
  detail: string;
};

/** Map -> Build -> Operate -> Compound. Rendered as a connected system. */
export const offerProgression: ProgressionStage[] = [
  {
    index: "01",
    name: "Map",
    detail: "Locate the constraint costing the most leads, time, or margin.",
  },
  {
    index: "02",
    name: "Build",
    detail: "Ship the smallest connected system that can move it.",
  },
  {
    index: "03",
    name: "Operate",
    detail: "Run it in production with monitoring and clear ownership.",
  },
  {
    index: "04",
    name: "Compound",
    detail: "Reinvest in what measurably works, then widen the system.",
  },
];

/** How a price behaves, so one-time and recurring costs are never conflated. */
export type PriceKind = "one-time" | "monthly" | "implementation-plus-monthly";

export const priceKindLabels: Record<PriceKind, string> = {
  "one-time": "One-time engagement",
  monthly: "Monthly retainer",
  "implementation-plus-monthly": "One-time implementation, then monthly",
};

export type Offer = {
  id: string;
  index: string;
  name: string;
  /** Small flag above the name. Not a "most popular" badge. */
  flag?: string;
  price: string;
  priceKind: PriceKind;
  /** Recurring cost for offers that carry both. */
  ongoingPrice?: string;
  description: string;
  includes: string[];
  /** Qualification detail. Always rendered in full, never in a tooltip. */
  note?: string;
  /** Secondary list, used by the AI sprint. */
  examples?: { title: string; items: string[] };
  ctaLabel: string;
};

export const entryOffer: Offer = {
  id: "growth-systems-map",
  index: "01",
  name: "Growth Systems Map",
  flag: "Best place to start",
  price: "$1,500",
  priceKind: "one-time",
  description:
    "A focused diagnostic that identifies where leads, time, or operational momentum are being lost—and what to build first.",
  includes: [
    "Owner and stakeholder strategy session",
    "Lead-flow and customer-journey map",
    "Website and local-search assessment",
    "Automation opportunity assessment",
    "Three highest-value opportunities",
    "Recommended technology stack",
    "90-day implementation roadmap",
    "Budget and projected-payback model",
  ],
  note: "The full $1,500 can be credited toward a qualifying implementation started within 30 days.",
  ctaLabel: "Start My Growth Map",
};

export const focusedOffers: Offer[] = [
  {
    id: "website-growth-system",
    index: "02",
    name: "Website Growth System",
    price: "Starting at $8,500",
    priceKind: "one-time",
    description:
      "A fast, persuasive digital front door built to turn the right visitors into measurable conversations.",
    includes: [
      "Positioning and conversion strategy",
      "Custom Next.js website",
      "Core service and location pages",
      "Local SEO foundation",
      "Analytics and conversion tracking",
      "CRM or email lead routing",
      "Performance and accessibility work",
      "Vercel deployment",
      "30 days of post-launch support",
    ],
    ctaLabel: "Plan My Website",
  },
  {
    id: "ai-workflow-sprint",
    index: "03",
    name: "AI Workflow Sprint",
    price: "Starting at $6,500",
    priceKind: "one-time",
    description:
      "One high-value workflow designed, integrated, documented, and placed into production.",
    includes: [
      "Workflow and ROI analysis",
      "One primary automation",
      "Up to three system integrations",
      "Human review and exception handling",
      "Testing and documentation",
      "Staff training",
      "30 days of monitoring",
    ],
    examples: {
      title: "Common sprints",
      items: [
        "Lead qualification and follow-up",
        "Missed-call recovery",
        "Proposal generation",
        "Customer intake and CRM entry",
        "Internal knowledge assistant",
        "Operational reporting",
      ],
    },
    note: "Software, messaging, and third-party usage costs are billed separately.",
    ctaLabel: "Explore an AI Sprint",
  },
  {
    id: "local-demand-engine",
    index: "04",
    name: "Local Demand Engine",
    price: "Starting at $1,750/month",
    priceKind: "monthly",
    description:
      "A durable local visibility system designed to generate qualified demand—not just ranking reports.",
    includes: [
      "Google Business Profile optimization",
      "Technical and on-page SEO",
      "Local citation management",
      "Review-generation system",
      "Strategic content",
      "Lead and ranking dashboard",
      "Quarterly strategy sessions",
    ],
    note: "Six-month initial engagement. A $1,500 onboarding fee may apply.",
    ctaLabel: "Grow Local Visibility",
  },
];

export const flagshipOffer: Offer = {
  id: "cedar-forge-growth-engine",
  index: "05",
  name: "Cedar Forge Growth Engine",
  flag: "Flagship",
  price: "$18,000–$30,000 implementation",
  priceKind: "implementation-plus-monthly",
  ongoingPrice: "Then $2,500–$4,000/month",
  description:
    "The complete Cedar Forge system: a connected website, demand engine, lead pipeline, and AI-enabled operation.",
  includes: [
    "Growth Systems Map",
    "Conversion-focused website",
    "Local SEO foundation",
    "CRM and lead-pipeline configuration",
    "Lead capture and follow-up automation",
    "One operational AI workflow",
    "Business analytics dashboard",
    "Ongoing search, conversion, and automation improvements",
  ],
  ctaLabel: "Build My Growth Engine",
};

/** Diagram rail inside the flagship panel. */
export const flagshipStages = [
  "Attract",
  "Convert",
  "Automate",
  "Compound",
] as const;

/** Every offer, in presentation order. Used for structured data. */
export const allOffers: Offer[] = [
  entryOffer,
  ...focusedOffers,
  flagshipOffer,
];

/* -------------------------------------------------------------------------- */
/* Free entry point: the Systems Snapshot                                      */
/* -------------------------------------------------------------------------- */

/**
 * The no-cost step ahead of the paid Growth Systems Map. Nobody should be asked
 * for $1,500 on a first visit, so this offers fifteen minutes and three
 * specific findings first, then names the Map as the next step for the
 * prospects it qualifies.
 *
 * Surfaced by the popup in src/components/sections/systems-snapshot-popup.tsx.
 */
export const systemsSnapshot = {
  id: "systems-snapshot",
  eyebrow: "Free · 15 minutes",
  name: "Systems Snapshot",
  headline: "Fifteen minutes. Three specific findings.",
  description:
    "A short working call, not a sales presentation. We look at how leads and work actually move through your business, then tell you what is worth fixing first.",
  /** What the prospect leaves with. Deliberately concrete and bounded. */
  deliverables: [
    "One website conversion problem",
    "One local-search opportunity",
    "One process worth automating",
    "A rough estimate of what each is costing you",
  ],
  /** Names the paid next step without making it a condition. */
  note: `If the Snapshot points to something bigger, the ${entryOffer.price} ${entryOffer.name} is the next step. Nothing here obligates you to take it.`,
  formHeading: "Request your Snapshot",
  formIntro:
    "Two minutes to request. We reply within one business day with a couple of times.",
  ctaLabel: "Book My Free Snapshot",
  privacyNote: "We reply from a Cedar Forge address. No newsletter, no list.",
} as const;

/**
 * Optional routing question on the Snapshot form. Kept optional on purpose: the
 * free offer should ask for as little as possible.
 */
export const snapshotFocusOptions = [
  { value: "website-conversion", label: "The website is not converting" },
  { value: "local-search", label: "We do not show up in local search" },
  { value: "manual-work", label: "Too much manual work" },
  { value: "lead-follow-up", label: "Leads slip through follow-up" },
  { value: "disconnected-tools", label: "Our tools do not talk to each other" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

/* -------------------------------------------------------------------------- */
/* Systems Care                                                                */
/* -------------------------------------------------------------------------- */

export type CareTier = {
  id: string;
  name: string;
  price: string;
  /** First item is rendered as an inherited-scope line where applicable. */
  includes: string[];
};

export const careTiers: CareTier[] = [
  {
    id: "essential",
    name: "Essential",
    price: "$750/month",
    includes: [
      "Hosting oversight",
      "Updates and maintenance",
      "Uptime monitoring",
      "Analytics reporting",
      "Up to two support hours",
      "Minor content updates",
    ],
  },
  {
    id: "managed",
    name: "Managed",
    price: "$1,500/month",
    includes: [
      "Everything in Essential",
      "Automation monitoring",
      "Monthly conversion improvements",
      "Up to five support hours",
      "Quarterly planning",
    ],
  },
  {
    id: "optimization",
    name: "Optimization",
    price: "$2,500/month",
    includes: [
      "Everything in Managed",
      "Active workflow improvements",
      "SEO and conversion experiments",
      "Up to ten support hours",
      "Monthly strategy session",
    ],
  },
];

export const careNote =
  "Systems Care is available for systems built or approved by Cedar Forge. Unused support time does not accumulate.";

/* -------------------------------------------------------------------------- */
/* Qualification                                                               */
/* -------------------------------------------------------------------------- */

export const qualification = {
  fit: [
    "Your business already has consistent customers or demand",
    "Manual processes are limiting growth",
    "Leads are being lost between inquiry and follow-up",
    "Your website no longer reflects the quality of the company",
    "Your team uses disconnected tools",
    "You want a long-term technical partner",
  ],
  notFit: [
    "The primary goal is the cheapest possible website",
    "There is no internal owner for the project",
    "The business is not prepared to change existing processes",
    "Success cannot be connected to a measurable business outcome",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* Outcomes, process, principles                                               */
/* -------------------------------------------------------------------------- */

export type Outcome = {
  figure: string;
  unit: string;
  label: string;
};

/**
 * Illustrative targets only. These are framed as discovery-stage goals in the
 * UI, never as measured results, and carry a visible disclaimer.
 */
export const outcomes: Outcome[] = [
  { figure: "10+", unit: "hours", label: "Reclaimed per week" },
  { figure: "24/7", unit: "coverage", label: "Lead capture and follow-up" },
  { figure: "One", unit: "partner", label: "Accountable for growth" },
];

export type ProcessStage = {
  index: string;
  name: string;
  summary: string;
  detail: string;
};

export const processStages: ProcessStage[] = [
  {
    index: "01",
    name: "Map",
    summary: "Find the constraint",
    detail:
      "We audit how work actually moves through your business and identify the single bottleneck holding back growth.",
  },
  {
    index: "02",
    name: "Build",
    summary: "Ship the system",
    detail:
      "We implement the automation, site, and search foundation as one connected system rather than three disconnected projects.",
  },
  {
    index: "03",
    name: "Compound",
    summary: "Improve what works",
    detail:
      "We measure against the constraint we set out to remove, then reinvest in the parts producing real momentum.",
  },
];

export const principles = [
  {
    name: "Business case first",
    detail:
      "Every recommendation starts with the money or the hours it frees up, not the technology behind it.",
  },
  {
    name: "Plain-English advice",
    detail:
      "You get straight explanations of what we are building and why it matters to your operation.",
  },
  {
    name: "Measurable delivery",
    detail:
      "We agree on what success looks like up front, then report against it honestly.",
  },
];

export const problemStatements = [
  "Too many tools.",
  "Too much manual work.",
  "Not enough qualified leads.",
] as const;

/* -------------------------------------------------------------------------- */
/* Contact form options                                                        */
/* -------------------------------------------------------------------------- */

export const solutionOptions = [
  { value: "growth-systems-map", label: "Growth Systems Map" },
  { value: "website-growth-system", label: "Website Growth System" },
  { value: "ai-workflow-sprint", label: "AI Workflow Sprint" },
  { value: "local-demand-engine", label: "Local Demand Engine" },
  { value: "cedar-forge-growth-engine", label: "Cedar Forge Growth Engine" },
  { value: "systems-care", label: "Systems Care" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

/**
 * Ranges are for routing and preparation only. Nothing in the form or the route
 * handler rejects a submission based on the selected range.
 */
export const investmentOptions = [
  { value: "1500-5000", label: "$1,500–$5,000" },
  { value: "5000-10000", label: "$5,000–$10,000" },
  { value: "10000-20000", label: "$10,000–$20,000" },
  { value: "20000-40000", label: "$20,000–$40,000" },
  { value: "40000-plus", label: "$40,000+" },
  { value: "not-sure", label: "Not sure yet" },
] as const;
