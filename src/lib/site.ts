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
    "Cedar Forge builds AI automation, conversion-focused websites, and local search systems for ambitious Iowa businesses.",
  socialCard: "/Cedar-Forge-Social-Card.png",
} as const;

/** In-page anchors. These become routes when the site expands past one page. */
export const navigation = [
  { href: "#what-we-build", label: "What We Build", id: "what-we-build" },
  { href: "#how-it-works", label: "How It Works", id: "how-it-works" },
  { href: "#why-cedar-forge", label: "Why Cedar Forge", id: "why-cedar-forge" },
] as const;

export const primaryCta = {
  href: "#contact",
  label: "Get Your Growth Map",
} as const;

export type Service = {
  id: string;
  index: string;
  name: string;
  summary: string;
  capabilities: string[];
  /** Marks the one panel that carries a warm cedar-toned surface. */
  featured?: boolean;
};

export const services: Service[] = [
  {
    id: "ai-automation",
    index: "01",
    name: "AI & Automation",
    summary:
      "Turn repetitive work into reliable workflows. From lead follow-up to internal knowledge, we build automation your team will actually use.",
    capabilities: [
      "AI workflow design",
      "CRM and operations automation",
      "Internal copilots",
    ],
    featured: true,
  },
  {
    id: "websites",
    index: "02",
    name: "Websites That Sell",
    summary:
      "A sharper digital front door—fast, persuasive, and designed to turn the right visitors into real conversations.",
    capabilities: [
      "Strategy and positioning",
      "Conversion-led design",
      "Performance and analytics",
    ],
  },
  {
    id: "local-search",
    index: "03",
    name: "Local Search Growth",
    summary:
      "Own the searches that matter in your market with a durable local SEO system, useful content, and measurable visibility.",
    capabilities: [
      "Local SEO foundation",
      "Content and authority",
      "Reporting tied to leads",
    ],
  },
];

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

/** Options for the contact form's service interest field. */
export const serviceInterests = [
  { value: "ai-automation", label: "AI & Automation" },
  { value: "websites", label: "Websites That Sell" },
  { value: "local-search", label: "Local Search Growth" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export type ServiceInterest = (typeof serviceInterests)[number]["value"];
