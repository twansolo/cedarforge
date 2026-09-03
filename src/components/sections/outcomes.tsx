import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { outcomes } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Outcomes() {
  return (
    <section
      id="outcomes"
      aria-labelledby="outcomes-heading"
      className="relative scroll-mt-20 overflow-hidden border-y border-muted-steel/20 bg-forge-black"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-fine opacity-45" />

      <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal>
            <div>
              <TechnicalLabel index="05">Outcomes</TechnicalLabel>
              <h2
                id="outcomes-heading"
                className="mt-6 text-headline font-extrabold text-balance-tight text-workshop-white"
              >
                Less busywork. More momentum.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-steel-text">
                We find the friction between attracting a customer and
                delivering the work—then engineer it out.
              </p>
            </div>
          </Reveal>

          <div>
            <dl className="border-t border-muted-steel/25">
              {outcomes.map((outcome, index) => (
                <Reveal key={outcome.label} delay={index * 0.08}>
                  <div className="flex items-baseline justify-between gap-6 border-b border-muted-steel/25 py-7">
                    <dt className="order-2 max-w-[52%] text-right text-[0.9375rem] font-medium leading-snug text-steel-text sm:max-w-none sm:text-base">
                      {outcome.label}
                    </dt>
                    <dd className="order-1 flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-4xl font-extrabold tracking-tight text-workshop-white sm:text-5xl",
                        )}
                      >
                        {outcome.figure}
                      </span>
                      <span className="label-technical text-signal-green">
                        {outcome.unit}
                      </span>
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>

            {/* Honest framing: these are discovery-stage targets, not results. */}
            <Reveal delay={0.24}>
              <p className="mt-6 flex gap-3 text-sm leading-relaxed text-steel-text">
                <span
                  aria-hidden="true"
                  className="mt-2 h-px w-6 shrink-0 bg-muted-steel/50"
                />
                <span>
                  Illustrative targets, not measured results. Specific goals are
                  established with you during discovery and depend on your
                  systems, market, and starting point. Results vary.
                </span>
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
