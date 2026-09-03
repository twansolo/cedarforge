import { classificationLabel } from "@/lib/leads/classify";
import { lifecycleLabel, sourceLabel, type Lead } from "@/lib/leads/query";
import { cn } from "@/lib/utils";

/**
 * The lead list.
 *
 * A real `<table>` with scoped headers, because this is tabular data and a grid
 * of divs would leave a screen reader with no way to associate a cell with its
 * column. It scrolls horizontally on narrow viewports rather than collapsing:
 * the whole point of the tool is comparing the vertical column against the
 * company column, and stacking cards breaks that read.
 */

const headerClasses =
  "label-technical whitespace-nowrap px-4 py-3 text-left text-steel-text";
const cellClasses = "px-4 py-4 align-top text-[0.9375rem] text-steel-text";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * How the vertical was decided. Shown next to every classified row so a wrong
 * segment is traceable to the keyword that caused it, not a mystery.
 */
function SignalNote({ lead }: { lead: Lead }) {
  const { signal, evidence } = lead.classification;

  if (signal === "none") {
    return (
      <span className="text-[0.8125rem] text-steel-text">
        No matching signal
      </span>
    );
  }

  const prefix = signal === "keyword" ? "Matched" : "Industry";

  return (
    <span className="font-mono text-[0.8125rem] text-steel-text">
      {prefix}: {evidence.slice(0, 3).join(", ")}
      {evidence.length > 3 ? ` +${evidence.length - 3}` : ""}
    </span>
  );
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="px-6 py-10 text-[0.9375rem] leading-relaxed text-steel-text sm:px-8">
        No contacts in the scanned window match these filters. Widen the scan, or
        clear the market and vertical to see everything that was pulled.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] border-collapse">
        <caption className="sr-only">
          HubSpot contacts in the scanned window, with the target vertical each
          one was matched to.
        </caption>
        <thead>
          <tr className="border-b border-muted-steel/25">
            <th scope="col" className={headerClasses}>
              Contact
            </th>
            <th scope="col" className={headerClasses}>
              Company
            </th>
            <th scope="col" className={headerClasses}>
              Vertical
            </th>
            <th scope="col" className={headerClasses}>
              Stage
            </th>
            <th scope="col" className={headerClasses}>
              Source
            </th>
            <th scope="col" className={headerClasses}>
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted-steel/15">
          {leads.map((lead) => {
            const { classification } = lead;
            const inTarget = Boolean(classification.market);

            return (
              <tr key={lead.id} className="hover:bg-steel-700/40">
                <td className={cellClasses}>
                  <a
                    href={lead.hubspotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-workshop-white underline decoration-muted-steel/50 underline-offset-4 hover:text-signal-green hover:decoration-signal-green"
                  >
                    {lead.name}
                    <span className="sr-only"> — open in HubSpot</span>
                  </a>
                  {lead.email ? (
                    <span className="mt-1 block font-mono text-[0.8125rem] break-all">
                      {lead.email}
                    </span>
                  ) : null}
                  {lead.phone ? (
                    <span className="mt-0.5 block font-mono text-[0.8125rem]">
                      {lead.phone}
                    </span>
                  ) : null}
                </td>

                <td className={cellClasses}>
                  <span className="block font-medium text-workshop-white">
                    {lead.company ?? "—"}
                  </span>
                  {lead.jobTitle ? (
                    <span className="mt-1 block text-[0.8125rem]">
                      {lead.jobTitle}
                    </span>
                  ) : null}
                  {lead.location ? (
                    <span className="mt-0.5 block text-[0.8125rem]">
                      {lead.location}
                    </span>
                  ) : null}
                </td>

                <td className={cellClasses}>
                  <span
                    className={cn(
                      "label-technical inline-block border px-2 py-1",
                      inTarget
                        ? "border-signal-green/45 text-signal-green"
                        : "border-muted-steel/35 text-steel-text",
                    )}
                  >
                    {classificationLabel(classification)}
                  </span>
                  <span className="mt-2 block">
                    <SignalNote lead={lead} />
                  </span>
                </td>

                <td className={cellClasses}>
                  <span className="block text-workshop-white">
                    {lifecycleLabel(lead.lifecycleStage) ?? "—"}
                  </span>
                  {lead.leadStatus ? (
                    <span className="mt-1 block text-[0.8125rem]">
                      {lifecycleLabel(lead.leadStatus)}
                    </span>
                  ) : null}
                </td>

                <td className={cellClasses}>
                  {sourceLabel(lead.source) ?? "—"}
                </td>

                <td className={cn(cellClasses, "whitespace-nowrap")}>
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
