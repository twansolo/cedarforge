import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { getAllProjects, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.name,
    description: project.tagline,
  };
}

export default async function ProjectPage(
  props: PageProps<"/projects/[slug]">,
) {
  const { slug } = await props.params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/projects"
        className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        &larr; All projects
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="font-mono text-xs text-muted">{project.year}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.name}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">{project.tagline}</p>
      </header>

      {(project.liveUrl || project.repoUrl) && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-forge-green px-4 py-2 text-white transition-colors hover:bg-forge-green/90"
            >
              Visit site
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 transition-colors hover:bg-surface"
            >
              Source
            </a>
          )}
        </div>
      )}

      <div className="mt-10 space-y-4 leading-8">
        {project.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="highlights">
        <h2 id="highlights" className="text-xl font-semibold tracking-tight">
          Highlights
        </h2>
        <ul className="mt-4 space-y-2">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-3 leading-7">
              <span
                aria-hidden="true"
                className="mt-3 size-1.5 shrink-0 rounded-full bg-forge-green dark:bg-forge-mint"
              />
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="stack">
        <h2 id="stack" className="text-xl font-semibold tracking-tight">
          Stack
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
