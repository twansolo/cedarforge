import { statusLabels, type ProjectStatus } from "@/lib/projects";

const styles: Record<ProjectStatus, string> = {
  live: "border-forge-green/40 bg-forge-green/10 text-forge-green dark:text-forge-mint",
  building: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  archived: "border-line bg-transparent text-muted",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
