export type ProjectStatus = "live" | "building" | "archived";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  /** Long-form copy, one entry per paragraph. */
  body: string[];
  highlights: string[];
  stack: string[];
  status: ProjectStatus;
  year: string;
  repoUrl?: string;
  liveUrl?: string;
};

export const statusLabels: Record<ProjectStatus, string> = {
  live: "Live",
  building: "In progress",
  archived: "Archived",
};

/**
 * Placeholder content. Replace these entries with real projects, or swap this
 * module for a CMS/database read when you have one.
 */
const projects: Project[] = [
  {
    slug: "rack-telemetry",
    name: "Rack Telemetry",
    tagline: "Streaming power, thermal, and airflow metrics from the floor.",
    body: [
      "Rack Telemetry collects per-outlet power draw and inlet temperatures across the hall, then rolls them up into a view an operator can read at a glance.",
      "Data lands in a time-series store on a five second cadence. The UI reads pre-aggregated rollups so the dashboard stays responsive even when a full hall is streaming.",
    ],
    highlights: [
      "Per-rack and per-outlet drill-down",
      "Threshold alerting with quiet hours",
      "Backfill-safe ingest for gateway reconnects",
    ],
    stack: ["Next.js", "TypeScript", "TimescaleDB", "Grafana"],
    status: "live",
    year: "2026",
  },
  {
    slug: "capacity-planner",
    name: "Capacity Planner",
    tagline: "Model power and cooling headroom before the hardware ships.",
    body: [
      "Capacity Planner turns a proposed hardware order into a projected load curve, so you find out whether a hall can absorb it before the purchase order goes out.",
      "Scenarios are versioned and diffable. Planners compare a draft against the committed baseline and see exactly which circuits move.",
    ],
    highlights: [
      "Scenario branching with side-by-side diffs",
      "Redundancy modeling for N+1 and 2N topologies",
      "CSV and BOM import",
    ],
    stack: ["Next.js", "Python", "Postgres", "DuckDB"],
    status: "building",
    year: "2026",
  },
  {
    slug: "asset-registry",
    name: "Asset Registry",
    tagline: "One record per unit, from receiving dock to decommission.",
    body: [
      "Asset Registry is the source of truth for what is installed where. Every unit carries its serial, position, warranty window, and full move history.",
      "It exposes a read API that the rest of the toolchain builds on, so rack diagrams and audit exports never drift out of sync.",
    ],
    highlights: [
      "Immutable audit trail on every field change",
      "Label printing and barcode check-in",
      "Read API consumed by the planner and telemetry apps",
    ],
    stack: ["Next.js", "Prisma", "Postgres"],
    status: "live",
    year: "2025",
  },
  {
    slug: "burn-in-harness",
    name: "Burn-in Harness",
    tagline: "Automated acceptance testing for freshly racked hardware.",
    body: [
      "Burn-in Harness drives a fixed stress profile against new nodes and records the results against the asset record, so acceptance is a report rather than a conversation.",
      "Superseded by the vendor's own validation suite in late 2025. Kept here for reference.",
    ],
    highlights: [
      "Reproducible stress profiles under version control",
      "Pass/fail gating wired into the receiving workflow",
    ],
    stack: ["Go", "Ansible", "Prometheus"],
    status: "archived",
    year: "2024",
  },
];

const statusOrder: Record<ProjectStatus, number> = {
  live: 0,
  building: 1,
  archived: 2,
};

export function getAllProjects(): Project[] {
  return [...projects].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      b.year.localeCompare(a.year) ||
      a.name.localeCompare(b.name),
  );
}

export function getFeaturedProjects(limit = 3): Project[] {
  return getAllProjects()
    .filter((project) => project.status !== "archived")
    .slice(0, limit);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
