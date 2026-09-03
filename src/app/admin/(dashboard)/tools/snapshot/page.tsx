import { CopyBrief } from "@/app/admin/(dashboard)/tools/snapshot/copy-brief";
import { SnapshotForm } from "@/app/admin/(dashboard)/tools/snapshot/snapshot-form";
import { Panel, PanelHeading } from "@/components/admin/panel";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { requireAdmin } from "@/lib/admin/dal";
import { systemsSnapshot } from "@/lib/site";
import { runSnapshotAudit, type SnapshotAudit } from "@/lib/site-audit/audit";
import { SiteAuditError } from "@/lib/site-audit/fetch";
import type { Finding, FindingSeverity } from "@/lib/site-audit/findings";
import { impactDisclaimer, type ImpactEstimate } from "@/lib/site-audit/impact";
import { cn } from "@/lib/utils";

export const metadata = { title: "Systems Snapshot" };

/** Live outbound fetches on every run. Nothing here is cacheable. */
export const dynamic = "force-dynamic";

/**
 * Above the audit's own 22-second budget, so a slow target site produces a
 * partial report rather than a platform timeout page.
 */
export const maxDuration = 30;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** First value only. A repeated query parameter is a hand-edited URL, not input. */
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Tolerates "$3,500" and "1 200", because those get pasted from notes. */
function num(value: string | string[] | undefined) {
  const raw = one(value)?.replace(/[$,\s%]/g, "");
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function currency(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export default async function SnapshotPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const domain = one(params.domain)?.trim();

  let audit: SnapshotAudit | null = null;
  let failure: string | null = null;

  if (domain) {
    try {
      audit = await runSnapshotAudit(domain, {
        monthlyVisitors: num(params.visitors),
        avgJobValue: num(params.job),
        closeRate: num(params.close),
        manualHoursPerWeek: num(params.hours),
        hourlyCost: num(params.rate),
      });
    } catch (error) {
      if (error instanceof SiteAuditError) {
        // Full detail to the logs; the operator gets the actionable version.
        console.error("[admin] Snapshot: audit failed:", error.message);
        failure = error.operatorMessage;
      } else {
        console.error("[admin] Snapshot: unexpected failure:", error);
        failure =
          "The Snapshot could not be produced. Check the server logs for detail.";
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PanelHeading
        title="Systems Snapshot"
        label="Delivery"
        index="01"
        description={`Runs the free ${systemsSnapshot.name} against a domain: one conversion problem, one local-search opportunity, one process worth automating, and a rough estimate of what each is costing. Read live from the public site — nothing is stored.`}
      />

      <Panel>
        <SnapshotForm
          domain={domain}
          assumptions={audit?.impact.assumptions}
        />
      </Panel>

      {failure ? (
        <Panel className="border-cedar-heartwood/45 bg-cedar-heartwood/10">
          <p className="text-[0.9375rem] leading-relaxed text-fresh-cut">
            {failure}
          </p>
        </Panel>
      ) : null}

      {!domain && !failure ? <EmptyState /> : null}

      {audit ? (
        <>
          <RunSummary audit={audit} />

          {audit.notes.length > 0 ? (
            <Panel
              className={cn(
                audit.blindSpot && "border-cedar-heartwood/45 bg-cedar-heartwood/10",
              )}
            >
              <TechnicalLabel index="03">
                {audit.blindSpot ? "Read this first" : "What this did not see"}
              </TechnicalLabel>
              <ul className="mt-4 flex flex-col gap-3">
                {audit.notes.map((note) => (
                  <li
                    key={note}
                    className={cn(
                      "flex gap-3 text-[0.9375rem] leading-relaxed",
                      audit.blindSpot ? "text-fresh-cut" : "text-steel-text",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-px w-4 shrink-0 bg-muted-steel/60"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <div className="flex flex-col gap-4">
            <TechnicalLabel index="04">The three findings</TechnicalLabel>

            <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
              <FindingCard
                heading="Website conversion"
                finding={audit.findings.conversion}
              />
              <FindingCard
                heading="Local search"
                finding={audit.findings.localSearch}
              />
              <FindingCard
                heading="Process to automate"
                finding={audit.findings.automation}
              />
            </div>
          </div>

          <ImpactPanel impact={audit.impact} />

          <div className="flex flex-col gap-4">
            <TechnicalLabel index="06">The deliverable</TechnicalLabel>
            <Panel>
              <CopyBrief brief={audit.brief} />
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <Panel>
      <PanelHeading
        title="Enter a domain to start"
        label="How this works"
        index="02"
      />
      <ol className="mt-6 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-steel-text">
        {[
          "The homepage is fetched live, plus the contact page when the homepage has no enquiry form, then robots.txt and sitemap.xml. Four requests at most.",
          "Each of the three areas runs an ordered list of rules and reports the first that fires, with the evidence behind it. Nothing is inferred that the page did not show.",
          "The impact estimate is arithmetic on the assumptions you supply. Leave them blank for conservative defaults, then re-run with their real numbers after the call.",
          "Copy the plain-text brief into the follow-up email. That is the deliverable the free offer promises.",
        ].map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="label-technical mt-1.5 shrink-0 text-signal-green">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function RunSummary({ audit }: { audit: SnapshotAudit }) {
  const items = [
    { label: "Final URL", value: audit.finalUrl, mono: true },
    { label: "Status", value: String(audit.page.status) },
    { label: "First byte", value: `${audit.page.ttfbMs} ms` },
    { label: "HTML", value: `${Math.round(audit.page.bytes / 1024)} KB` },
    { label: "Scripts", value: String(audit.facts.scriptCount) },
    {
      label: "Words of text",
      value: audit.facts.wordCount.toLocaleString("en-US"),
    },
  ];

  return (
    <Panel>
      <PanelHeading title={audit.host} label="What was read" index="02" />

      <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="label-technical text-steel-text">{item.label}</dt>
            <dd
              className={cn(
                "mt-2 text-[0.9375rem] text-workshop-white",
                item.mono && "break-all font-mono text-[0.8125rem]",
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {audit.contactUrl ? (
        <p className="mt-6 break-all font-mono text-[0.8125rem] leading-relaxed text-steel-text">
          Contact page also read: {audit.contactUrl}
        </p>
      ) : null}
    </Panel>
  );
}

const severityLabels: Record<FindingSeverity, string> = {
  high: "Costing money now",
  medium: "Worth fixing",
  low: "Housekeeping",
};

const severityClasses: Record<FindingSeverity, string> = {
  high: "border-cedar-heartwood/55 text-fresh-cut",
  medium: "border-muted-steel/50 text-workshop-white",
  low: "border-muted-steel/30 text-steel-text",
};

function FindingCard({
  heading,
  finding,
}: {
  heading: string;
  finding: Finding | null;
}) {
  return (
    <Panel className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="label-technical text-steel-text">{heading}</p>
        {finding ? (
          <span
            className={cn(
              "label-technical inline-block border px-2 py-1",
              severityClasses[finding.severity],
            )}
          >
            {severityLabels[finding.severity]}
          </span>
        ) : null}
      </div>

      {finding ? (
        <>
          <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-workshop-white">
            {finding.title}
          </h3>

          <p className="mt-3 text-[0.9375rem] leading-relaxed text-steel-text">
            {finding.detail}
          </p>

          <div className="mt-5 border-t border-muted-steel/20 pt-4">
            <p className="label-technical text-steel-text">What we would do</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-workshop-white">
              {finding.recommendation}
            </p>
          </div>

          {/*
           * Evidence is shown next to every finding for the same reason the Leads
           * table prints what a segment matched on: a wrong call should be
           * traceable to the observation that caused it, on the spot.
           */}
          <div className="mt-5 border-t border-muted-steel/20 pt-4">
            <p className="label-technical text-steel-text">Evidence</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {finding.evidence.map((item) => (
                <li
                  key={item}
                  className="break-words font-mono text-[0.8125rem] leading-relaxed text-steel-text"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-auto pt-5 font-mono text-[0.75rem] text-steel-text/80">
            rule: {finding.rule}
          </p>
        </>
      ) : (
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-steel-text">
          Nothing conclusive from the outside. Either this area is in reasonable
          shape or it needs a look from inside the business — say that on the call
          rather than inventing a problem.
        </p>
      )}
    </Panel>
  );
}

function ImpactPanel({ impact }: { impact: ImpactEstimate }) {
  const { assumptions } = impact;

  const assumptionRows = [
    {
      label: "Visitors / month",
      value: assumptions.monthlyVisitors.toLocaleString("en-US"),
      source: assumptions.sources.monthlyVisitors,
    },
    {
      label: "Avg job value",
      value: currency(assumptions.avgJobValue),
      source: assumptions.sources.avgJobValue,
      note: assumptions.jobValueBasis,
    },
    {
      label: "Close rate",
      value: `${assumptions.closeRate}%`,
      source: assumptions.sources.closeRate,
    },
    {
      label: "Manual hours / week",
      value: String(assumptions.manualHoursPerWeek),
      source: assumptions.sources.manualHoursPerWeek,
    },
    {
      label: "Hourly cost",
      value: currency(assumptions.hourlyCost),
      source: assumptions.sources.hourlyCost,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <TechnicalLabel index="05">Rough business impact</TechnicalLabel>

      <Panel>
        {impact.lines.length === 0 ? (
          <p className="text-[0.9375rem] leading-relaxed text-steel-text">
            No estimate: none of the three areas produced a finding to price. That
            is a legitimate outcome, and it is worth saying plainly rather than
            manufacturing a number.
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-muted-steel/20">
              {impact.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4 first:pt-0"
                >
                  <div className="max-w-xl">
                    <p className="text-[0.9375rem] font-semibold text-workshop-white">
                      {line.label}
                      <span className="ml-2 font-normal text-steel-text">
                        {line.nature === "revenue"
                          ? "new revenue"
                          : "cost already being spent"}
                      </span>
                    </p>
                    <p className="mt-1.5 font-mono text-[0.8125rem] leading-relaxed text-steel-text">
                      {line.formula}
                    </p>
                  </div>

                  <p className="font-mono text-[0.9375rem] text-workshop-white">
                    {currency(line.low)}–{currency(line.high)}
                    <span className="text-steel-text"> / mo</span>
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-t border-muted-steel/30 pt-5">
              <p className="text-[0.9375rem] font-semibold text-workshop-white">
                Combined
              </p>
              <p className="font-mono text-workshop-white">
                {currency(impact.monthlyLow)}–{currency(impact.monthlyHigh)}
                <span className="text-steel-text"> / mo · </span>
                {currency(impact.annualLow)}–{currency(impact.annualHigh)}
                <span className="text-steel-text"> / yr</span>
              </p>
            </div>
          </>
        )}

        <div className="mt-8 border-t border-muted-steel/20 pt-6">
          <p className="label-technical text-steel-text">Assumptions</p>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assumptionRows.map((row) => (
              <div key={row.label}>
                <dt className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[0.8125rem] text-steel-text">
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      "label-technical",
                      row.source === "operator"
                        ? "text-signal-green"
                        : "text-steel-text/80",
                    )}
                  >
                    {row.source === "operator" ? "yours" : "assumed"}
                  </span>
                </dt>
                <dd className="mt-1 font-mono text-[0.9375rem] text-workshop-white">
                  {row.value}
                </dd>
                {row.note ? (
                  <p className="mt-1 text-[0.75rem] leading-snug text-steel-text">
                    {row.note}
                  </p>
                ) : null}
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-2xl text-[0.8125rem] leading-relaxed text-steel-text">
            {impactDisclaimer}
          </p>
        </div>
      </Panel>
    </div>
  );
}
