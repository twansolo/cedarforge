import Link from "next/link";

import { ProjectCard } from "@/components/project-card";
import { getFeaturedProjects } from "@/lib/projects";

export default function Home() {
  const featured = getFeaturedProjects();

  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-widest text-forge-green dark:text-forge-mint">
          Cedar Forge
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Tooling for the people who run the floor.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
          We build the software that keeps data center capacity, telemetry, and
          asset records honest. Here is what we are working on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            href="/projects"
            className="rounded-full bg-forge-green px-5 py-2.5 text-white transition-colors hover:bg-forge-green/90"
          >
            Browse projects
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-line px-5 py-2.5 transition-colors hover:bg-surface"
          >
            About
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-16" aria-labelledby="featured">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="featured" className="text-2xl font-semibold tracking-tight">
            Active projects
          </h2>
          <Link
            href="/projects"
            className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            All projects
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </ul>
      </section>
    </div>
  );
}
