import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { TechnicalLabel } from "@/components/ui/technical-label";

/**
 * Global 404. It sits at the app root so it catches URLs matching no route
 * group, which means it renders outside (marketing) and brings its own chrome.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className="relative flex min-h-[70vh] items-center overflow-hidden bg-forge-black">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid-fine opacity-50"
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 py-28 sm:px-8 lg:px-12">
          <TechnicalLabel index="404">Route not found</TechnicalLabel>
          <h1 className="mt-6 max-w-2xl text-headline font-extrabold text-balance-tight text-workshop-white">
            That page isn&rsquo;t part of the system.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-steel-text">
            The link may be out of date. Head back to the main site to pick up
            where you left off.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/">Back to home</ButtonLink>
            <ButtonLink href="/#contact" variant="secondary">
              Get Your Growth Map
            </ButtonLink>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
