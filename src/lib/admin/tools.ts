/**
 * Registry of admin tools.
 *
 * The dashboard renders straight from this list, so adding a tool is two steps:
 *
 *   1. Add an entry here.
 *   2. Create `src/app/admin/tools/<slug>/page.tsx` that calls `requireAdmin()`
 *      as its first statement.
 *
 * `status` lets a tool be listed while it is still being built, which keeps the
 * roadmap visible without shipping a dead link.
 */

export type AdminToolStatus = "live" | "building";

export type AdminTool = {
  slug: string;
  name: string;
  /** One line, plain language, describing what the tool does for the operator. */
  description: string;
  /** Short mono label grouping tools on the dashboard. */
  category: string;
  status: AdminToolStatus;
  /** True when the tool changes state, so the UI can flag it. */
  mutates?: boolean;
};

export const adminTools: AdminTool[] = [
  {
    slug: "snapshot",
    name: "Systems Snapshot",
    description:
      "Runs the free Systems Snapshot against a domain and writes the brief to send.",
    category: "Delivery",
    status: "live",
  },
  {
    slug: "leads",
    name: "Leads",
    description:
      "Recent HubSpot contacts, segmented against the three target markets. Read-only.",
    category: "Pipeline",
    status: "live",
  },
  {
    slug: "systems-check",
    name: "Systems Check",
    description:
      "Which integrations this environment has configured, and which are still missing.",
    category: "Diagnostics",
    status: "live",
  },
  {
    slug: "cache-refresh",
    name: "Cache Refresh",
    description:
      "Rebuild the cached marketing pages after a content or copy change.",
    category: "Operations",
    status: "live",
    mutates: true,
  },
];

export function adminToolPath(tool: AdminTool): string {
  return `/admin/tools/${tool.slug}`;
}

export function findAdminTool(slug: string): AdminTool | undefined {
  return adminTools.find((tool) => tool.slug === slug);
}

/** Tools grouped by category, preserving registry order within each group. */
export function adminToolsByCategory(): Array<{
  category: string;
  tools: AdminTool[];
}> {
  const groups = new Map<string, AdminTool[]>();

  for (const tool of adminTools) {
    const existing = groups.get(tool.category);
    if (existing) {
      existing.push(tool);
    } else {
      groups.set(tool.category, [tool]);
    }
  }

  return [...groups].map(([category, tools]) => ({ category, tools }));
}
