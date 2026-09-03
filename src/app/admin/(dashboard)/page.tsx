import Link from "next/link";

import { Panel, PanelHeading } from "@/components/admin/panel";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { requireAdmin } from "@/lib/admin/dal";
import { adminToolPath, adminToolsByCategory } from "@/lib/admin/tools";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const groups = adminToolsByCategory();

  return (
    <div className="flex flex-col gap-12">
      <div>
        <TechnicalLabel index="00">Control surface</TechnicalLabel>
        <h1 className="mt-5 max-w-2xl text-headline font-extrabold text-balance-tight text-workshop-white">
          Internal tools and automations.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel-text">
          Everything here runs server-side behind the admin session. Add a tool
          to <code className="font-mono text-sm text-workshop-white">
            src/lib/admin/tools.ts
          </code>{" "}
          and it appears on this page.
        </p>
      </div>

      {groups.map((group, groupIndex) => (
        <section key={group.category} className="flex flex-col gap-5">
          <TechnicalLabel index={String(groupIndex + 1).padStart(2, "0")}>
            {group.category}
          </TechnicalLabel>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.tools.map((tool) => {
              const isLive = tool.status === "live";

              const card = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-tight text-workshop-white">
                      {tool.name}
                    </h2>
                    {tool.mutates ? (
                      <span className="label-technical shrink-0 border border-cedar-heartwood/45 px-2 py-1 text-fresh-cut">
                        Writes
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-steel-text">
                    {tool.description}
                  </p>
                  <p className="label-technical mt-6 text-signal-green">
                    {isLive ? "Open tool →" : "In progress"}
                  </p>
                </>
              );

              return (
                <li key={tool.slug}>
                  {isLive ? (
                    <Link
                      href={adminToolPath(tool)}
                      className="flex h-full flex-col border border-muted-steel/25 bg-steel-800/70 p-6 transition-colors hover:border-signal-green/60"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col border border-muted-steel/20 bg-steel-800/40 p-6 opacity-70">
                      {card}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Panel>
        <PanelHeading
          title="Adding a tool"
          label="Pattern"
          description="Two steps, and the guard is the part that matters."
        />
        <ol className="mt-6 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-steel-text">
          <li>
            <span className="font-semibold text-workshop-white">1.</span> Add an
            entry to{" "}
            <code className="font-mono text-sm text-workshop-white">
              src/lib/admin/tools.ts
            </code>
            .
          </li>
          <li>
            <span className="font-semibold text-workshop-white">2.</span> Create{" "}
            <code className="font-mono text-sm text-workshop-white">
              src/app/admin/(dashboard)/tools/&lt;slug&gt;/page.tsx
            </code>{" "}
            and call{" "}
            <code className="font-mono text-sm text-workshop-white">
              await requireAdmin()
            </code>{" "}
            as its first statement. Server actions the tool uses call{" "}
            <code className="font-mono text-sm text-workshop-white">
              await assertAdmin()
            </code>{" "}
            first, since an action is its own endpoint.
          </li>
        </ol>
      </Panel>
    </div>
  );
}
