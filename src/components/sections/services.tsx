import { LayoutTemplate, MapPin, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { services } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  "ai-automation": Workflow,
  websites: LayoutTemplate,
  "local-search": MapPin,
};

export function Services() {
  return (
    <section
      id="what-we-build"
      aria-labelledby="services-heading"
      className="scroll-mt-20 bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <Reveal>
          <div className="max-w-3xl">
            <TechnicalLabel index="01" tone="light">
              What we build
            </TechnicalLabel>
            <h2
              id="services-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight"
            >
              One partner. Three growth levers.
            </h2>
          </div>
        </Reveal>

        {/*
         * Shared hairlines rather than three floating cards: the panels read as
         * one drawn assembly.
         */}
        <ul className="mt-14 grid grid-cols-1 border-t border-forge-black/15 lg:mt-16 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[service.id];

            return (
              <Reveal
                as="li"
                key={service.id}
                delay={index * 0.08}
                className={cn(
                  "group relative flex flex-col border-b border-forge-black/15 p-7 transition-colors duration-300 sm:p-9",
                  index > 0 && "lg:border-l lg:border-forge-black/15",
                  service.featured
                    ? "bg-fresh-cut/45 hover:bg-fresh-cut/70"
                    : "hover:bg-forge-black/[0.035]",
                )}
              >
                {/* Cedar rule that draws in on hover. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-cedar-green transition-transform duration-300 group-hover:scale-x-100"
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="label-technical text-forge-black/45">
                    {service.index}
                  </span>
                  <Icon
                    aria-hidden="true"
                    className="size-5 text-cedar-ink"
                    strokeWidth={1.75}
                  />
                </div>

                <h3 className="mt-7 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {service.name}
                </h3>
                <p className="mt-4 leading-relaxed text-forge-black/70">
                  {service.summary}
                </p>

                <ul className="mt-8 space-y-0 border-t border-forge-black/12">
                  {service.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="flex items-center gap-3 border-b border-forge-black/12 py-3"
                    >
                      <span
                        aria-hidden="true"
                        className="h-px w-3 shrink-0 bg-cedar-green"
                      />
                      <span className="text-[0.9375rem] font-medium">
                        {capability}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
