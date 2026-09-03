import { classifyContact } from "@/lib/leads/classify";

/**
 * The business-impact estimate.
 *
 * ── What this is, and is not ─────────────────────────────────────────────────
 * It is arithmetic on stated assumptions. It is not a measurement, and it cannot
 * be: nothing about traffic, close rate, or job value is visible from outside a
 * website. Every input below is either an operator's number or a documented
 * default, every formula is shown in the UI next to its result, and the output
 * is a range rather than a figure.
 *
 * That honesty is the point. The Snapshot's promise is "a rough estimate of what
 * each is costing you", and a prospect who is handed a precise-looking number
 * built on invented traffic data will find out and stop trusting the rest of it.
 * The one on the call should be able to say where each number came from.
 *
 * Defaults are deliberately conservative. An estimate that undershoots and still
 * justifies the work is worth more than one that oversells.
 */

/** Weeks per month, averaged. Keeps monthly hour maths off a 4-week fiction. */
const WEEKS_PER_MONTH = 4.33;

/**
 * Session-to-enquiry lift band applied when a conversion problem is found.
 * Percentage points, not a percentage increase: a site going from 1.0% to 1.5%
 * has gained 0.5 points. Bounded low on purpose — this is the range a single
 * fixed problem plausibly returns, not the ceiling for a rebuild.
 */
const CONVERSION_LIFT_POINTS = { low: 0.4, high: 1.2 } as const;

/** Extra monthly enquiries from local visibility, banded by how much is missing. */
const LOCAL_ENQUIRY_BANDS = [
  { missing: 1, low: 1, high: 3 },
  { missing: 2, low: 2, high: 5 },
  { missing: 3, low: 3, high: 7 },
  { missing: 4, low: 4, high: 8 },
] as const;

/**
 * Share of a manual process that automation actually removes. Never all of it:
 * exceptions, review, and the handful of cases a human still has to touch are
 * what the remainder is.
 */
const AUTOMATION_RECOVERY = { low: 0.5, high: 0.85 } as const;

/**
 * Default job value by target market, used until the operator enters the real
 * one. Markets come from src/lib/leads/verticals.ts so the Snapshot and the
 * Leads tool describe the same three segments.
 */
const MARKET_JOB_VALUE: Record<string, number> = {
  "home-services": 3_500,
  clinics: 1_200,
  "professional-services": 4_000,
};

const FALLBACK_JOB_VALUE = 2_500;

export type ImpactAssumptions = {
  /** Monthly organic and direct visitors. */
  monthlyVisitors: number;
  /** Average value of one closed job or client. */
  avgJobValue: number;
  /** Share of enquiries that become customers, as a percentage. */
  closeRate: number;
  /** Hours per week currently spent on the process worth automating. */
  manualHoursPerWeek: number;
  /** Loaded hourly cost of whoever does that work. */
  hourlyCost: number;
};

export type AssumptionSource = "operator" | "default";

export type ResolvedAssumptions = ImpactAssumptions & {
  /** Which values the operator supplied, so the UI can mark the rest. */
  sources: Record<keyof ImpactAssumptions, AssumptionSource>;
  /** How the job-value default was chosen. */
  jobValueBasis: string;
};

export type ImpactLine = {
  id: "conversion" | "local-search" | "automation";
  label: string;
  /** Plain-language formula, rendered next to the number. */
  formula: string;
  low: number;
  high: number;
  /** "revenue" is new business; "cost" is money already being spent. */
  nature: "revenue" | "cost";
};

export type ImpactEstimate = {
  lines: ImpactLine[];
  monthlyLow: number;
  monthlyHigh: number;
  annualLow: number;
  annualHigh: number;
  assumptions: ResolvedAssumptions;
};

/** Defaults, with the job value chosen from whatever market the domain matches. */
export function defaultAssumptions(input: {
  host: string;
  businessName?: string | null;
}): { values: ImpactAssumptions; jobValueBasis: string } {
  const classification = classifyContact({
    website: input.host,
    company: input.businessName ?? null,
  });

  const marketId = classification.market?.id;
  const avgJobValue = marketId
    ? (MARKET_JOB_VALUE[marketId] ?? FALLBACK_JOB_VALUE)
    : FALLBACK_JOB_VALUE;

  const jobValueBasis = classification.market
    ? `${classification.market.name} default, matched on ${classification.evidence.slice(0, 2).join(", ")}`
    : "No target market matched, so the cross-market default is used";

  return {
    values: {
      /*
       * A deliberately low traffic figure. Without analytics access this is the
       * one number nobody can guess well, and the UI asks the operator for it
       * before the call.
       */
      monthlyVisitors: 750,
      avgJobValue,
      closeRate: 40,
      manualHoursPerWeek: 5,
      hourlyCost: 45,
    },
    jobValueBasis,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Merges operator overrides over the defaults, tracking which is which.
 *
 * Every value is clamped. A stray zero or a pasted phone number in the visitors
 * box should produce a conservative estimate, not a division by zero or a
 * headline promising eight figures.
 */
export function resolveAssumptions(
  defaults: { values: ImpactAssumptions; jobValueBasis: string },
  overrides: Partial<Record<keyof ImpactAssumptions, number | undefined>>,
): ResolvedAssumptions {
  const limits: Record<keyof ImpactAssumptions, [number, number]> = {
    monthlyVisitors: [0, 5_000_000],
    avgJobValue: [0, 1_000_000],
    closeRate: [0, 100],
    manualHoursPerWeek: [0, 80],
    hourlyCost: [0, 1_000],
  };

  const sources = {} as Record<keyof ImpactAssumptions, AssumptionSource>;
  const values = { ...defaults.values };

  for (const key of Object.keys(limits) as Array<keyof ImpactAssumptions>) {
    const supplied = overrides[key];
    if (typeof supplied === "number" && Number.isFinite(supplied)) {
      const [min, max] = limits[key];
      values[key] = clamp(supplied, min, max);
      sources[key] = "operator";
    } else {
      sources[key] = "default";
    }
  }

  return { ...values, sources, jobValueBasis: defaults.jobValueBasis };
}

function money(value: number) {
  return Math.round(value);
}

/**
 * Builds the estimate from the findings that actually fired.
 *
 * A line only appears when its finding did. Charging a prospect's attention for
 * "local search: $0 because nothing is wrong" is noise, and inventing a line for
 * a finding we could not confirm would be worse.
 */
export function estimateImpact({
  assumptions,
  hasConversionFinding,
  localSignalsMissing,
  hasAutomationFinding,
}: {
  assumptions: ResolvedAssumptions;
  hasConversionFinding: boolean;
  /** How many local-search signals were absent, 0 when the basics are covered. */
  localSignalsMissing: number;
  hasAutomationFinding: boolean;
}): ImpactEstimate {
  const {
    monthlyVisitors,
    avgJobValue,
    closeRate,
    manualHoursPerWeek,
    hourlyCost,
  } = assumptions;

  const closed = closeRate / 100;
  const lines: ImpactLine[] = [];

  if (hasConversionFinding && monthlyVisitors > 0) {
    const low = monthlyVisitors * (CONVERSION_LIFT_POINTS.low / 100);
    const high = monthlyVisitors * (CONVERSION_LIFT_POINTS.high / 100);

    lines.push({
      id: "conversion",
      label: "Website conversion",
      formula: `${monthlyVisitors.toLocaleString("en-US")} visitors/mo × ${CONVERSION_LIFT_POINTS.low}–${CONVERSION_LIFT_POINTS.high} point lift × ${closeRate}% close × $${avgJobValue.toLocaleString("en-US")}`,
      low: money(low * closed * avgJobValue),
      high: money(high * closed * avgJobValue),
      nature: "revenue",
    });
  }

  if (localSignalsMissing > 0) {
    const band =
      LOCAL_ENQUIRY_BANDS.find(
        (entry) => entry.missing === Math.min(localSignalsMissing, 4),
      ) ?? LOCAL_ENQUIRY_BANDS[0];

    lines.push({
      id: "local-search",
      label: "Local search",
      formula: `${band.low}–${band.high} extra enquiries/mo × ${closeRate}% close × $${avgJobValue.toLocaleString("en-US")}`,
      low: money(band.low * closed * avgJobValue),
      high: money(band.high * closed * avgJobValue),
      nature: "revenue",
    });
  }

  if (hasAutomationFinding && manualHoursPerWeek > 0 && hourlyCost > 0) {
    const monthlyCost = manualHoursPerWeek * WEEKS_PER_MONTH * hourlyCost;

    lines.push({
      id: "automation",
      label: "Process automation",
      formula: `${manualHoursPerWeek} h/wk × ${WEEKS_PER_MONTH} wks × $${hourlyCost}/h × ${AUTOMATION_RECOVERY.low * 100}–${AUTOMATION_RECOVERY.high * 100}% recovered`,
      low: money(monthlyCost * AUTOMATION_RECOVERY.low),
      high: money(monthlyCost * AUTOMATION_RECOVERY.high),
      nature: "cost",
    });
  }

  const monthlyLow = lines.reduce((total, line) => total + line.low, 0);
  const monthlyHigh = lines.reduce((total, line) => total + line.high, 0);

  return {
    lines,
    monthlyLow,
    monthlyHigh,
    annualLow: monthlyLow * 12,
    annualHigh: monthlyHigh * 12,
    assumptions,
  };
}

export const impactDisclaimer =
  "Illustrative only. These are arithmetic on the assumptions shown, not measured results, and every input above can be replaced with the real number before the call.";
