import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 text-muted">
        That route does not exist. It may have been renamed or removed.
      </p>
      <Link
        href="/projects"
        className="mt-8 rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
      >
        Browse projects
      </Link>
    </div>
  );
}
