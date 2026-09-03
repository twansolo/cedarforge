import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every Cedar Forge project, from live tooling to archived experiments.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Projects
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        {projects.length} projects, sorted by status and then by year.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </ul>
    </div>
  );
}
