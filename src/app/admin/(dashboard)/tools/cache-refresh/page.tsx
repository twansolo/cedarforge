import { RefreshButton } from "@/app/admin/(dashboard)/tools/cache-refresh/refresh-button";
import { Panel, PanelHeading } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/dal";

export const metadata = { title: "Cache Refresh" };

export default async function CacheRefreshPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PanelHeading
        title="Cache Refresh"
        label="Operations"
        index="01"
        description="Marks the cached marketing pages stale so the next visitor gets a freshly rendered copy. Safe to run at any time."
      />

      <Panel>
        <RefreshButton />
      </Panel>
    </div>
  );
}
