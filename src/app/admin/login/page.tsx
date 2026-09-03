import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/login/login-form";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { ADMIN_HOME_PATH, safeAdminRedirect } from "@/lib/admin/config";
import { getAdminSession } from "@/lib/admin/dal";

export const metadata = { title: "Sign in" };

/**
 * A cookie is required to render meaningfully, so this route is dynamic. That
 * also guarantees the login screen is never served from a cache.
 */
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // The proxy already bounces signed-in operators, this covers a direct hit.
  if (await getAdminSession()) redirect(ADMIN_HOME_PATH);

  const params = await searchParams;
  const requested = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeAdminRedirect(requested);

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-forge-black px-5 py-16 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-fine opacity-40"
      />

      <div className="relative mx-auto w-full max-w-md">
        <TechnicalLabel index="00">Restricted</TechnicalLabel>

        <h1 className="mt-5 text-headline font-extrabold text-balance-tight text-workshop-white">
          Cedar Forge admin.
        </h1>
        <p className="mt-4 leading-relaxed text-steel-text">
          Internal tooling. Sign in to continue.
        </p>

        <div className="mt-9 border border-muted-steel/25 bg-workshop-white p-6 sm:p-8">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-[0.8125rem] text-steel-text">
          Sessions last 8 hours and are limited to this browser. Five failed
          attempts pause sign-in for 15 minutes.
        </p>
      </div>
    </main>
  );
}
