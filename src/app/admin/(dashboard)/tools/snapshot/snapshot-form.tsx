import { Button } from "@/components/ui/button";
import type { ResolvedAssumptions } from "@/lib/site-audit/impact";

/**
 * A plain GET form, not a client component.
 *
 * Same reasoning as the Leads filters: the domain and the assumptions live in
 * the URL, so a Snapshot can be bookmarked, re-run after the discovery call with
 * the real numbers, or pasted to someone else and land on the same report. There
 * is nothing to wire up — `method="get"` rewrites the query string and the page
 * re-renders from `searchParams`.
 */

const fieldClasses =
  "w-full border border-muted-steel/45 bg-steel-900 px-3 py-2.5 text-[0.9375rem] " +
  "text-workshop-white placeholder:text-steel-text " +
  "focus:border-signal-green focus:outline-none focus:ring-1 focus:ring-signal-green";

const labelClasses = "label-technical text-steel-text";

type Props = {
  domain?: string;
  /** Resolved values, so the boxes show what the report actually used. */
  assumptions?: ResolvedAssumptions;
};

/**
 * Assumption inputs.
 *
 * Left empty until the operator types something. Rendering the defaults as
 * values would make every field look like a supplied number, and the report
 * marks the difference between "you told us" and "we assumed" everywhere else.
 */
const numberFields = [
  {
    name: "visitors",
    label: "Visitors / month",
    key: "monthlyVisitors",
    placeholder: "750",
    hint: "From their analytics if you have it.",
  },
  {
    name: "job",
    label: "Avg job value",
    key: "avgJobValue",
    placeholder: "3500",
    hint: "One closed job or client.",
  },
  {
    name: "close",
    label: "Close rate %",
    key: "closeRate",
    placeholder: "40",
    hint: "Enquiries that become customers.",
  },
  {
    name: "hours",
    label: "Manual hours / week",
    key: "hours",
    placeholder: "5",
    hint: "On the process being automated.",
  },
  {
    name: "rate",
    label: "Hourly cost",
    key: "hourlyCost",
    placeholder: "45",
    hint: "Loaded cost of whoever does it.",
  },
] as const;

export function SnapshotForm({ domain, assumptions }: Props) {
  const supplied = (name: (typeof numberFields)[number]["name"]) => {
    if (!assumptions) return "";

    switch (name) {
      case "visitors":
        return assumptions.sources.monthlyVisitors === "operator"
          ? String(assumptions.monthlyVisitors)
          : "";
      case "job":
        return assumptions.sources.avgJobValue === "operator"
          ? String(assumptions.avgJobValue)
          : "";
      case "close":
        return assumptions.sources.closeRate === "operator"
          ? String(assumptions.closeRate)
          : "";
      case "hours":
        return assumptions.sources.manualHoursPerWeek === "operator"
          ? String(assumptions.manualHoursPerWeek)
          : "";
      case "rate":
        return assumptions.sources.hourlyCost === "operator"
          ? String(assumptions.hourlyCost)
          : "";
    }
  };

  return (
    <form method="get" className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-2">
          <label className={labelClasses} htmlFor="snapshot-domain">
            Domain
          </label>
          <input
            id="snapshot-domain"
            name="domain"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            defaultValue={domain ?? ""}
            placeholder="example.com"
            className={fieldClasses}
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto">
          Run Snapshot
        </Button>
      </div>

      <fieldset className="border-t border-muted-steel/20 pt-6">
        <legend className="sr-only">Impact assumptions</legend>

        <p className="text-[0.8125rem] leading-relaxed text-steel-text">
          Optional. Anything left blank uses a conservative default, and the
          report marks which numbers were assumed. Fill these in after the call
          and re-run to replace the estimate with their real figures.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {numberFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <label className={labelClasses} htmlFor={`snapshot-${field.name}`}>
                {field.label}
              </label>
              <input
                id={`snapshot-${field.name}`}
                name={field.name}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                defaultValue={supplied(field.name)}
                placeholder={field.placeholder}
                className={fieldClasses}
              />
              <span className="text-[0.75rem] leading-snug text-steel-text">
                {field.hint}
              </span>
            </div>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
