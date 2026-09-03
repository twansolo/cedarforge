import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { WoodGrain } from "@/components/ui/wood-grain";
import { principles, siteConfig } from "@/lib/site";

export function LocalRoots() {
  return (
    <section
      id="why-cedar-forge"
      aria-labelledby="local-roots-heading"
      className="scroll-mt-20 bg-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="grid gap-px overflow-hidden border border-muted-steel/25 bg-muted-steel/25 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          {/* Cedar rail: deep green, monochrome grain, architectural grid */}
          <div className="relative overflow-hidden bg-cedar-green">
            <div aria-hidden="true" className="absolute inset-0 bg-forge-black/30" />
            <WoodGrain className="absolute inset-0 size-full text-workshop-white/25" />
            <div
              aria-hidden="true"
              className="absolute inset-0 grid-instrument opacity-25"
            />
            {/* Cedar Heartwood, used only as a material detail. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-cedar-heartwood"
            />

            <div className="relative flex h-full min-h-[320px] flex-col justify-between gap-16 p-8 sm:p-10 lg:min-h-[440px]">
              <p className="label-technical text-workshop-white/85">
                {siteConfig.locality}, {siteConfig.regionName}
              </p>

              <div>
                <p className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-workshop-white sm:text-[2.5rem]">
                  Local Roots
                </p>
                <span
                  aria-hidden="true"
                  className="my-4 block h-px w-16 bg-fresh-cut/60"
                />
                <p className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-fresh-cut sm:text-[2.5rem]">
                  Technical Depth
                </p>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="bg-forge-black p-8 sm:p-10 lg:p-12">
            <Reveal>
              <TechnicalLabel index="07">Why Cedar Forge</TechnicalLabel>
              <h2
                id="local-roots-heading"
                className="mt-6 text-headline font-extrabold text-balance-tight text-workshop-white"
              >
                Midwest direct. Technically serious.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-text">
                Cedar Forge is built for Iowa business owners who want modern
                technology without the jargon, bloated retainers, or vague
                promises. You get senior-level strategy, hands-on
                implementation, and a partner close enough to understand the
                market.
              </p>
            </Reveal>

            <dl className="mt-10 border-t border-muted-steel/25">
              {principles.map((principle, index) => (
                <Reveal key={principle.name} delay={index * 0.08}>
                  <div className="border-b border-muted-steel/25 py-5">
                    <dt className="flex items-center gap-3 text-base font-semibold tracking-tight text-workshop-white">
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 bg-signal-green"
                      />
                      {principle.name}
                    </dt>
                    <dd className="mt-2 pl-[1.125rem] text-[0.9375rem] leading-relaxed text-steel-text">
                      {principle.detail}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>

            <p className="label-technical mt-8 text-steel-text">
              Proudly based in {siteConfig.locality}, {siteConfig.regionName}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
