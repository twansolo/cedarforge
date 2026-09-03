import { LeadFilters } from "@/app/admin/(dashboard)/tools/leads/lead-filters";
import { LeadTable } from "@/app/admin/(dashboard)/tools/leads/lead-table";
import { Panel, PanelHeading } from "@/components/admin/panel";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { requireAdmin } from "@/lib/admin/dal";
import { HubSpotCrmError, isHubSpotCrmConfigured } from "@/lib/hubspot-crm";
import {
  DEFAULT_SCAN_SIZE,
  SCAN_SIZES,
  loadLeads,
  type LeadsView,
} from "@/lib/leads/query";
import { findMarket, findVertical, targetMarkets } from "@/lib/leads/verticals";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };

/**
 * Never prerendered and never cached. The page reads live CRM data behind an
 * admin session, so a stored copy would be both stale and shared.
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** First value only. A repeated query parameter is a hand-edited URL, not input. */
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;

  /*
   * Every filter is validated against the registry rather than trusted. An
   * unknown market or vertical id falls back to "no filter", so a stale
   * bookmark shows the full list instead of an empty table that reads like
   * "you have no leads".
   */
  const rawMarket = one(params.market);
  const market =
    rawMarket === "outside" || findMarket(rawMarket) ? rawMarket : undefined;
  const vertical = findVertical(one(params.vertical))?.vertical.id;
  const query = one(params.q)?.trim() || undefined;

  const requestedScan = Number(one(params.scan));
  const scan = SCAN_SIZES.includes(requestedScan as (typeof SCAN_SIZES)[number])
    ? requestedScan
    : DEFAULT_SCAN_SIZE;

  const configured = isHubSpotCrmConfigured();

  let view: LeadsView | null = null;
  let failure: string | null = null;

  if (configured) {
    try {
      view = await loadLeads({ market, vertical, query, scan });
    } catch (error) {
      if (error instanceof HubSpotCrmError) {
        // The full response body goes to the logs; the operator gets the
        // sanitised version, which never contains the token.
        console.error("[admin] Leads: HubSpot read failed:", error.message);
        failure = error.operatorMessage;
      } else {
        console.error("[admin] Leads: unexpected failure:", error);
        failure =
          "The lead list could not be loaded. Check the server logs for detail.";
      }
    }
  }

  /** Preserves the search box and scan window when switching segments. */
  function segmentHref(target?: string) {
    const next = new URLSearchParams();
    if (target) next.set("market", target);
    if (query) next.set("q", query);
    if (scan !== DEFAULT_SCAN_SIZE) next.set("scan", String(scan));
    const search = next.toString();
    return search ? `/admin/tools/leads?${search}` : "/admin/tools/leads";
  }

  return (
    <div className="flex flex-col gap-8">
      <PanelHeading
        title="Leads"
        label="Pipeline"
        index="01"
        description="Recent HubSpot contacts, segmented against the three target markets. Read-only: HubSpot stays the system of record, and nothing here writes back to it."
      />

      {!configured ? <SetupPanel /> : null}

      {failure ? (
        <Panel className="border-cedar-heartwood/45 bg-cedar-heartwood/10">
          <p className="text-[0.9375rem] leading-relaxed text-fresh-cut">
            {failure}
          </p>
        </Panel>
      ) : null}

      {configured && view ? (
        <>
          <Panel>
            <LeadFilters
              market={market}
              vertical={vertical}
              query={query}
              scan={scan}
            />
            <p className="mt-6 text-[0.8125rem] leading-relaxed text-steel-text">
              Verticals are derived from the company name, website, and job title
              — HubSpot has no field for them — so segment counts describe the{" "}
              <strong className="font-semibold text-workshop-white">
                {view.scanned} newest
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-workshop-white">
                {view.totalInPortal.toLocaleString("en-US")}
              </strong>{" "}
              matching contacts, not the whole portal. The search box is passed
              through to HubSpot and does cover everything.
            </p>
          </Panel>

          <Segments view={view} active={market} hrefFor={segmentHref} />

          <div className="flex flex-col gap-4">
            <TechnicalLabel index="03">
              {view.leads.length === view.scanned
                ? `${view.leads.length} contacts`
                : `${view.leads.length} of ${view.scanned} scanned`}
            </TechnicalLabel>

            <Panel className="p-0 sm:p-0">
              <LeadTable leads={view.leads} />
            </Panel>
          </div>

          <TargetReference />
        </>
      ) : null}
    </div>
  );
}

/** Segment summary. Each tile is a link, so the counts double as navigation. */
function Segments({
  view,
  active,
  hrefFor,
}: {
  view: LeadsView;
  active?: string;
  hrefFor: (target?: string) => string;
}) {
  const tiles = [
    ...view.segments.map((segment) => ({
      id: segment.market.id,
      index: segment.market.index,
      name: segment.market.name,
      count: segment.count,
      detail:
        segment.count === 0
          ? "Nothing in this window"
          : `${segment.verticalCount} resolved to a vertical`,
      inTarget: true,
    })),
    {
      id: "outside",
      index: "04",
      name: "Outside target",
      count: view.outsideCount,
      detail: "No market signal found",
      inTarget: false,
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <TechnicalLabel index="02">Segments in this window</TechnicalLabel>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const isActive = active === tile.id;

          return (
            <li key={tile.id}>
              <a
                href={hrefFor(isActive ? undefined : tile.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex h-full flex-col border bg-steel-800/70 p-5 transition-colors",
                  isActive
                    ? "border-signal-green"
                    : "border-muted-steel/25 hover:border-signal-green/60",
                )}
              >
                <TechnicalLabel index={tile.index}>{tile.name}</TechnicalLabel>
                <p
                  className={cn(
                    "mt-4 font-mono text-3xl font-bold",
                    tile.inTarget ? "text-workshop-white" : "text-steel-text",
                  )}
                >
                  {tile.count}
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-steel-text">
                  {tile.detail}
                </p>
                <p className="label-technical mt-4 text-signal-green">
                  {isActive ? "Clear filter" : "Filter →"}
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The targeting itself, so the tool documents what it is segmenting against. */
function TargetReference() {
  return (
    <Panel>
      <PanelHeading
        title="What we are targeting"
        label="Focus"
        index="04"
        description="The first six months. Edit src/lib/leads/verticals.ts to narrow or widen it — the segments above follow that file."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {targetMarkets.map((market) => (
          <div key={market.id}>
            <TechnicalLabel index={market.index}>{market.name}</TechnicalLabel>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-steel-text">
              {market.thesis}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {market.verticals.map((vertical) => (
                <li
                  key={vertical.id}
                  className="border border-muted-steel/30 px-2 py-1 text-[0.8125rem] text-workshop-white"
                >
                  {vertical.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Shown until HUBSPOT_PRIVATE_APP_TOKEN exists. Not an error state. */
function SetupPanel() {
  return (
    <Panel className="border-cedar-heartwood/45 bg-cedar-heartwood/10">
      <PanelHeading
        title="Connect HubSpot to switch this on"
        label="Setup"
        description="Reading the CRM needs a private app token. The contact form's Forms API integration does not grant read access, so this is a separate credential."
      />

      <ol className="mt-6 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-fresh-cut">
        <li>
          <span className="font-semibold">1.</span> In HubSpot: Settings →
          Integrations → Private Apps → Create a private app.
        </li>
        <li>
          <span className="font-semibold">2.</span> On the Scopes tab enable{" "}
          <code className="font-mono text-sm">crm.objects.contacts.read</code>.
          Nothing else — a read-only token cannot damage the CRM if it leaks.
        </li>
        <li>
          <span className="font-semibold">3.</span> Copy the access token into{" "}
          <code className="font-mono text-sm">
            HUBSPOT_PRIVATE_APP_TOKEN
          </code>{" "}
          in your environment, then redeploy.
        </li>
      </ol>
    </Panel>
  );
}
