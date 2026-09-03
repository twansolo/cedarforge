import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What Cedar Forge is and how we work.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        About
      </h1>
      <div className="mt-8 space-y-4 leading-8 text-muted">
        <p>
          Cedar Forge builds internal tooling for data center operations. The
          work tends to be unglamorous and load-bearing: telemetry pipelines,
          capacity models, and asset records that other teams depend on.
        </p>
        <p>
          Replace this copy with your own. The project entries live in{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-foreground">
            src/lib/projects.ts
          </code>
          .
        </p>
      </div>
    </div>
  );
}
