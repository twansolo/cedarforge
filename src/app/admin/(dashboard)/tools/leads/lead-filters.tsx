import { Button } from "@/components/ui/button";
import { SCAN_SIZES } from "@/lib/leads/query";
import { targetMarkets } from "@/lib/leads/verticals";

/**
 * A plain GET form, not a client component.
 *
 * Filter state lives in the URL, which means it survives a reload, can be
 * bookmarked for a segment the operator checks daily, and needs no JavaScript
 * to work. `method="get"` replaces the query string with the submitted fields,
 * so there is nothing to wire up: the page re-renders from `searchParams`.
 */

const fieldClasses =
  "w-full border border-muted-steel/45 bg-steel-900 px-3 py-2.5 text-[0.9375rem] " +
  "text-workshop-white placeholder:text-steel-text " +
  "focus:border-signal-green focus:outline-none focus:ring-1 focus:ring-signal-green";

const labelClasses = "label-technical text-steel-text";

type Props = {
  market?: string;
  vertical?: string;
  query?: string;
  scan: number;
};

export function LeadFilters({ market, vertical, query, scan }: Props) {
  return (
    <form
      method="get"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="leads-q">
          Search HubSpot
        </label>
        <input
          id="leads-q"
          name="q"
          type="search"
          defaultValue={query ?? ""}
          placeholder="Name, email, company, phone"
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="leads-market">
          Market
        </label>
        <select
          id="leads-market"
          name="market"
          defaultValue={market ?? ""}
          className={fieldClasses}
        >
          <option value="">All contacts</option>
          {targetMarkets.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
          <option value="outside">Outside target verticals</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="leads-vertical">
          Vertical
        </label>
        <select
          id="leads-vertical"
          name="vertical"
          defaultValue={vertical ?? ""}
          className={fieldClasses}
        >
          <option value="">Any vertical</option>
          {targetMarkets.map((entry) => (
            <optgroup key={entry.id} label={entry.name}>
              {entry.verticals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="leads-scan">
          Scan
        </label>
        <div className="flex gap-2">
          <select
            id="leads-scan"
            name="scan"
            defaultValue={String(scan)}
            className={fieldClasses}
          >
            {SCAN_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} newest
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" className="shrink-0">
            Apply
          </Button>
        </div>
      </div>
    </form>
  );
}
