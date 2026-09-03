import { entryOffer, systemsSnapshot } from "@/lib/site";
import { extractFacts, extractLocality, type PageFacts } from "@/lib/site-audit/extract";
import {
  displayHost,
  fetchHomepage,
  fetchOptional,
  type FetchedPage,
} from "@/lib/site-audit/fetch";
import {
  countLocalSignalsMissing,
  findAutomationOpportunity,
  findConversionProblem,
  findLocalSearchOpportunity,
  summariseIntake,
  type AuditContext,
  type Finding,
  type IntakeSurface,
} from "@/lib/site-audit/findings";
import {
  defaultAssumptions,
  estimateImpact,
  impactDisclaimer,
  resolveAssumptions,
  type ImpactAssumptions,
  type ImpactEstimate,
} from "@/lib/site-audit/impact";

/**
 * Runs one Systems Snapshot against a domain.
 *
 * ── Request budget ───────────────────────────────────────────────────────────
 * Four requests at most: the homepage, one contact page when the homepage has no
 * enquiry form, then robots.txt and sitemap.xml. Everything after the homepage
 * is optional and skipped once the deadline is close, so a slow site degrades to
 * a smaller report instead of timing out the whole page. Somebody else's server
 * is being used here; the tool identifies itself and keeps the footprint to the
 * few documents it actually reads.
 *
 * Nothing is stored. Each run fetches live and renders once, which keeps this
 * free of a data-retention question about other people's websites.
 */

/** Total wall-clock budget for a run, under the route's maxDuration. */
const BUDGET_MS = 22_000;

/** Optional documents get less patience than the homepage. */
const OPTIONAL_TIMEOUT_MS = 4_000;

/** Sitemap `<loc>` entries examined. Enough to judge shape, not a crawl. */
const MAX_SITEMAP_URLS = 2_000;

const LOCATION_URL_PATTERN =
  /\/(?:locations?|service-areas?|areas?-we-serve|service-area|cities|towns?|neighborhoods?)\//i;

export type SnapshotFindings = {
  conversion: Finding | null;
  localSearch: Finding | null;
  automation: Finding | null;
};

export type SnapshotAudit = {
  /** What the operator typed. */
  input: string;
  host: string;
  finalUrl: string;
  fetchedAt: string;
  page: FetchedPage;
  facts: PageFacts;
  intake: IntakeSurface;
  contactUrl: string | null;
  /**
   * True when the homepage arrived as a near-empty shell. Findings that depend
   * on something being absent are suppressed, and the UI says so.
   */
  blindSpot: boolean;
  findings: SnapshotFindings;
  impact: ImpactEstimate;
  /** Plain-text version, for pasting into the follow-up email. */
  brief: string;
  /** Anything the operator should know about how the run went. */
  notes: string[];
};

function parseSitemap(body: string) {
  const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
    .slice(0, MAX_SITEMAP_URLS)
    .map((match) => match[1] ?? "");

  return {
    found: true,
    urlCount: locs.length,
    locationUrls: locs.filter((url) => LOCATION_URL_PATTERN.test(url)).length,
  };
}

/** Best guess at the business name, for the market classifier. */
function guessBusinessName(facts: PageFacts) {
  const title = facts.title?.trim();
  if (!title) return facts.h1s[0] ?? null;

  /*
   * Titles are almost always "Business Name | Tagline" or "Service in City -
   * Business". The first segment is the better guess, and the classifier only
   * needs enough text to match a keyword.
   */
  const [first] = title.split(/\s*[|·—–]\s*/);
  return (first ?? title).trim() || null;
}

export async function runSnapshotAudit(
  input: string,
  overrides: Partial<Record<keyof ImpactAssumptions, number | undefined>> = {},
): Promise<SnapshotAudit> {
  const startedAt = Date.now();
  const remaining = () => BUDGET_MS - (Date.now() - startedAt);

  const { page, requested, httpsFailed } = await fetchHomepage(input);
  const facts = extractFacts(page.body, page.url);
  const notes: string[] = [];

  if (page.truncated) {
    notes.push(
      `The homepage is larger than ${Math.round(page.bytes / 1024)} KB and was read up to that point, so anything below it was not analysed.`,
    );
  }

  if (page.redirects > 0) {
    notes.push(
      `Followed ${page.redirects} redirect${page.redirects === 1 ? "" : "s"} from ${requested.href} to ${page.url}.`,
    );
  }

  if (httpsFailed) {
    notes.push("https did not respond, so this was read over http.");
  }

  const base = new URL(page.url);

  /*
   * The contact page is only worth a request when the homepage had no enquiry
   * form. Otherwise the intake surface is already known, and this would be a
   * request against somebody's server for nothing.
   */
  let contact: { url: string; facts: PageFacts } | null = null;

  if (facts.enquiryForms.length === 0 && remaining() > OPTIONAL_TIMEOUT_MS) {
    const candidate = facts.contactPageLinks[0];
    if (candidate) {
      try {
        const contactPage = await fetchOptional(
          new URL(candidate, base),
          "text/html,application/xhtml+xml",
          OPTIONAL_TIMEOUT_MS,
        );
        if (contactPage) {
          contact = {
            url: contactPage.url,
            facts: extractFacts(contactPage.body, contactPage.url),
          };
        }
      } catch {
        // Optional by definition: a contact page that will not load changes
        // nothing about the findings drawn from the homepage.
      }
    }
  }

  let robots: AuditContext["robots"] = null;
  let sitemap: AuditContext["sitemap"] = null;

  if (remaining() > OPTIONAL_TIMEOUT_MS) {
    /*
     * These two are tiny and go to the same host, so they run together. The
     * homepage above is what the budget is really spent on.
     */
    const [robotsPage, sitemapPage] = await Promise.all([
      fetchOptional(new URL("/robots.txt", base), "text/plain", OPTIONAL_TIMEOUT_MS),
      fetchOptional(new URL("/sitemap.xml", base), "application/xml,text/xml", OPTIONAL_TIMEOUT_MS),
    ]);

    robots = robotsPage
      ? {
          found: true,
          hasSitemapDirective: /^\s*sitemap\s*:/im.test(robotsPage.body),
        }
      : { found: false, hasSitemapDirective: false };

    sitemap =
      sitemapPage && /<(?:urlset|sitemapindex)\b/i.test(sitemapPage.body)
        ? parseSitemap(sitemapPage.body)
        : { found: false, urlCount: 0, locationUrls: 0 };

    if (robots?.found && !robots.hasSitemapDirective && sitemap?.found) {
      notes.push("sitemap.xml exists but robots.txt does not reference it.");
    }
  } else {
    notes.push(
      "The homepage used most of the time budget, so robots.txt and sitemap.xml were not checked.",
    );
  }

  const context: AuditContext = {
    page,
    facts,
    contact,
    httpsFailed,
    robots,
    sitemap,
  };

  const intake = summariseIntake(context);

  if (facts.likelyClientRendered) {
    notes.push(
      `The homepage returned only ${facts.wordCount} words of text with ${facts.scriptCount} scripts, which means it renders in the browser. Findings that depend on something being missing were skipped, because this tool reads the HTML the server sends.`,
    );
  }

  const findings: SnapshotFindings = {
    conversion: findConversionProblem(context, intake),
    localSearch: findLocalSearchOpportunity(context),
    automation: findAutomationOpportunity(context, intake),
  };

  const host = displayHost(base);
  const defaults = defaultAssumptions({
    host,
    businessName: guessBusinessName(facts),
  });

  /*
   * The automation rule knows better than the default how much time its process
   * takes, so its suggestion becomes the default when the operator has not
   * entered a number.
   */
  const suggestedHours = findings.automation?.suggestedHoursPerWeek;
  if (typeof suggestedHours === "number") {
    defaults.values.manualHoursPerWeek = suggestedHours;
  }

  const assumptions = resolveAssumptions(defaults, overrides);

  const impact = estimateImpact({
    assumptions,
    hasConversionFinding: Boolean(findings.conversion),
    localSignalsMissing: findings.localSearch
      ? countLocalSignalsMissing(context)
      : 0,
    hasAutomationFinding: Boolean(findings.automation),
  });

  const fetchedAt = new Date().toISOString();

  return {
    input,
    host,
    finalUrl: page.url,
    fetchedAt,
    page,
    facts,
    intake,
    contactUrl: contact?.url ?? null,
    blindSpot: facts.likelyClientRendered,
    findings,
    impact,
    brief: buildBrief({ host, fetchedAt, facts, findings, impact, notes }),
    notes,
  };
}

/* -------------------------------------------------------------------------- */
/* The deliverable                                                            */
/* -------------------------------------------------------------------------- */

function currency(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

const SECTION_TITLES: Record<keyof SnapshotFindings, string> = {
  conversion: "1. WEBSITE CONVERSION",
  localSearch: "2. LOCAL SEARCH",
  automation: "3. PROCESS TO AUTOMATE",
};

/**
 * The plain-text Snapshot.
 *
 * This is the actual deliverable: what gets read on the call and pasted into the
 * follow-up. It is written to be sent as-is, so it names what was found, what it
 * would take to fix, and where the numbers came from — including the ones the
 * operator has not replaced yet.
 */
function buildBrief({
  host,
  fetchedAt,
  facts,
  findings,
  impact,
  notes,
}: {
  host: string;
  fetchedAt: string;
  facts: PageFacts;
  findings: SnapshotFindings;
  impact: ImpactEstimate;
  notes: string[];
}) {
  const locality = extractLocality(facts);
  const date = new Date(fetchedAt).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [
    `${systemsSnapshot.name.toUpperCase()} — ${host}`,
    `Prepared ${date}${locality?.city ? ` · ${locality.city}${locality.state ? `, ${locality.state}` : ""}` : ""}`,
    "",
    "Read from the live site. Fifteen minutes on a call turns each of these into",
    "something specific to your operation.",
    "",
  ];

  for (const key of Object.keys(SECTION_TITLES) as Array<
    keyof SnapshotFindings
  >) {
    const finding = findings[key];
    lines.push(SECTION_TITLES[key]);

    if (!finding) {
      lines.push(
        "  Nothing conclusive from the outside. Worth a look together on the call.",
        "",
      );
      continue;
    }

    lines.push(
      `  ${finding.title}`,
      "",
      ...wrap(finding.detail, 76, "  "),
      "",
      "  What we would do:",
      ...wrap(finding.recommendation, 76, "  "),
      "",
      `  Evidence: ${finding.evidence.join(" · ")}`,
      "",
    );
  }

  lines.push("ROUGH IMPACT (illustrative)");

  if (impact.lines.length === 0) {
    lines.push(
      "  No estimate: none of the three areas produced a finding to price.",
      "",
    );
  } else {
    for (const line of impact.lines) {
      lines.push(
        `  ${line.label}: ${currency(line.low)}–${currency(line.high)} / month`,
        `    ${line.formula}`,
      );
    }

    lines.push(
      "",
      `  Combined: ${currency(impact.monthlyLow)}–${currency(impact.monthlyHigh)} / month`,
      `            ${currency(impact.annualLow)}–${currency(impact.annualHigh)} / year`,
      "",
      "  Assumptions used:",
      `    ${impact.assumptions.monthlyVisitors.toLocaleString("en-US")} visitors/month${impact.assumptions.sources.monthlyVisitors === "default" ? " (estimate — replace with the real number)" : ""}`,
      `    ${impact.assumptions.closeRate}% of enquiries close${impact.assumptions.sources.closeRate === "default" ? " (assumed)" : ""}`,
      `    ${currency(impact.assumptions.avgJobValue)} average job value${impact.assumptions.sources.avgJobValue === "default" ? " (assumed)" : ""}`,
      `    ${impact.assumptions.manualHoursPerWeek} hours/week on the manual process at ${currency(impact.assumptions.hourlyCost)}/hour${impact.assumptions.sources.manualHoursPerWeek === "default" ? " (assumed)" : ""}`,
      "",
      ...wrap(impactDisclaimer, 76, "  "),
      "",
    );
  }

  if (notes.length > 0) {
    lines.push("WHAT THIS DID NOT SEE");
    for (const note of notes) {
      lines.push(...wrap(note, 76, "  · "));
    }
    lines.push("");
  }

  lines.push(
    "NEXT STEP",
    ...wrap(
      `If the Snapshot points to something bigger, the ${entryOffer.price} ${entryOffer.name} maps the whole operation and returns a 90-day plan. ${entryOffer.note ?? ""}`,
      76,
      "  ",
    ),
    "",
    "Cedar Forge.AI · Cedar Rapids, Iowa · cedarforge.ai",
  );

  return lines.join("\n");
}

/** Soft wrap for the plain-text brief, so it survives an email client. */
function wrap(text: string, width: number, prefix: string) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const rows: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length + prefix.length > width) {
      rows.push(prefix + current);
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }

  if (current) rows.push(prefix + current);
  // Continuation lines line up under the first, without repeating a bullet.
  return rows.map((row, index) =>
    index === 0 ? row : row.replace(prefix, " ".repeat(prefix.length)),
  );
}
