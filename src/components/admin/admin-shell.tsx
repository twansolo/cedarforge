import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { signOut } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tools/systems-check", label: "Systems Check" },
] as const;

type AdminShellProps = {
  children: ReactNode;
  /** Session subject, shown so it is obvious which identity is signed in. */
  subject: string;
  /** Absolute session expiry, ISO string, rendered as a local time. */
  expiresAt: string;
};

/**
 * Chrome for every signed-in admin page: identity, navigation, and sign-out.
 *
 * Sign-out is a plain form posting to a server action, so it works without
 * JavaScript and gets Next's origin check. A link would not: a GET that mutates
 * session state can be triggered by any image tag on any page.
 */
export function AdminShell({ children, subject, expiresAt }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-forge-black">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-signal-green focus:bg-forge-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-workshop-white"
      >
        Skip to admin content
      </a>

      <header className="border-b border-muted-steel/25 bg-steel-900">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="Admin dashboard" className="py-1">
              <Logo />
            </Link>
            <span className="label-technical border border-signal-green/40 px-2 py-1 text-signal-green">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-steel-text sm:inline">
              {subject}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="border border-muted-steel/45 px-4 py-2 text-sm font-semibold text-workshop-white transition-colors hover:border-signal-green hover:text-signal-green"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav
          aria-label="Admin"
          className="mx-auto max-w-[1400px] px-5 pb-1 sm:px-8"
        >
          <ul className="flex flex-wrap gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-block px-3 py-2 text-sm font-medium text-steel-text",
                    "transition-colors hover:text-workshop-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main
        id="admin-content"
        className="relative flex-1 overflow-hidden px-5 py-10 sm:px-8 sm:py-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid-fine opacity-40"
        />
        <div className="relative mx-auto max-w-[1400px]">{children}</div>
      </main>

      <footer className="border-t border-muted-steel/25 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <p className="label-technical text-steel-text">
            Internal tooling — not indexed
          </p>
          <p className="text-[0.8125rem] text-steel-text">
            Session expires{" "}
            <time dateTime={expiresAt}>
              {new Date(expiresAt).toLocaleString("en-US", {
                timeZone: "America/Chicago",
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              CT
            </time>
          </p>
        </div>
      </footer>
    </div>
  );
}
