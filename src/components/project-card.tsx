import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="group relative rounded-xl border border-line bg-surface p-6 transition-colors hover:border-forge-green/50">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/projects/${project.slug}`}>
            {/* Stretched link keeps the whole card clickable with one tab stop. */}
            <span className="absolute inset-0 rounded-xl" />
            {project.name}
          </Link>
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-2 text-sm leading-6 text-muted">{project.tagline}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>
    </li>
  );
}
