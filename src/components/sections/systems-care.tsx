import { IncludeList, OfferNote } from "@/components/ui/include-list";
import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { careNote, careTiers } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Ongoing service for existing clients. Deliberately reads as a service-level
 * spec rather than a SaaS pricing table: no highlighted "recommended" column,
 * no bright surfaces, shared hairlines throughout.
 */
export function SystemsCare() {
  return (
    <section
      id="systems-care"
      aria-labelledby="systems-care-heading"
      className="relative scroll-mt-24 overflow-hidden border-y border-muted-steel/20 bg-forge-black"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-fine opacity-40" />

      <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <TechnicalLabel index="03">Systems Care</TechnicalLabel>
            <h2
              id="systems-care-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight text-workshop-white"
            >
              Keep the system performing.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-steel-text">
              Websites, integrations, and automations need active ownership.
              Systems Care keeps the infrastructure reliable while creating room
              for continuous improvement.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 items-start border-t border-muted-steel/25 lg:mt-14 lg:grid-cols-3">
          {careTiers.map((tier, index) => (
            <Reveal
              as="li"
              key={tier.id}
              delay={index * 0.08}
              className={cn(
                "border-b border-muted-steel/25 p-6 sm:p-8",
                index > 0 && "lg:border-l lg:border-muted-steel/25",
              )}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight text-workshop-white">
                  {tier.name}
                </h3>
                <p className="label-technical text-steel-text">
                  Tier {index + 1}
                </p>
              </div>

              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-workshop-white sm:text-[1.75rem]">
                  {tier.price}
                </span>
              </p>
              <p className="label-technical mt-2 text-signal-green">
                Monthly retainer
              </p>

              <IncludeList
                items={tier.includes}
                label={`${tier.name} scope`}
                tone="dark"
                className="mt-6"
              />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.2}>
          <OfferNote tone="dark" className="mt-8 max-w-2xl">
            {careNote}
          </OfferNote>
        </Reveal>
      </div>
    </section>
  );
}
