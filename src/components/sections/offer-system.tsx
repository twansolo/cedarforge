"use client";

import { motion } from "framer-motion";

import { TechnicalLabel } from "@/components/ui/technical-label";
import { offerProgression } from "@/lib/site";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The offer system: the constraint-first premise plus the
 * Map / Build / Operate / Compound progression.
 *
 * Built as an instrument rail rather than a step timeline — shared hairlines,
 * a bus line the stages sit on, and a signal that travels it once on view.
 */
export function OfferSystem() {
  return (
    <section
      id="what-we-build"
      aria-labelledby="offer-system-heading"
      className="relative scroll-mt-24 overflow-hidden border-y border-muted-steel/20 bg-forge-black"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-fine opacity-50" />

      <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="max-w-3xl">
          <TechnicalLabel index="01">The Cedar Forge offer system</TechnicalLabel>
          <h2
            id="offer-system-heading"
            className="mt-6 text-headline font-extrabold text-balance-tight text-workshop-white"
          >
            Start with the constraint. Build what moves the business.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-steel-text">
            Every engagement begins by identifying the highest-value obstacle
            between attention, conversion, and delivery. From there, we build the
            smallest connected system capable of producing a measurable result.
          </p>
        </div>

        {/* Progression rail */}
        <div className="relative mt-16 lg:mt-20">
          {/* Bus line the stages sit on */}
          <div
            aria-hidden="true"
            className="absolute left-[15px] top-3 h-[calc(100%-1.5rem)] w-px overflow-hidden bg-muted-steel/30 lg:left-0 lg:top-[15px] lg:h-px lg:w-full"
          >
            <motion.span
              className="absolute inset-0 origin-top bg-cedar-green lg:origin-left"
              initial={{ scaleY: 0, scaleX: 1 }}
              whileInView={{ scaleY: 1, scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease }}
            />
            {/* Signal travelling the bus once the section is reached */}
            <motion.span
              className="absolute size-full bg-gradient-to-b from-transparent via-signal-green to-transparent lg:bg-gradient-to-r"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: [0, 1, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.6, delay: 0.4, ease: "linear" }}
            />
          </div>

          <ol className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            {offerProgression.map((stage, index) => (
              <motion.li
                key={stage.index}
                className="relative pl-12 lg:pl-0"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease }}
              >
                {/* Node clamped onto the bus */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 flex size-[31px] items-center justify-center border border-muted-steel/40 bg-forge-black lg:relative lg:mb-6"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      index === 0 ? "bg-signal-green" : "bg-cedar-green",
                    )}
                    style={{
                      animation: `signal-pulse 3s ease-in-out ${index * 0.35}s infinite`,
                    }}
                  />
                </span>

                <p className="label-technical text-steel-text">{stage.index}</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-workshop-white">
                  {stage.name}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-steel-text">
                  {stage.detail}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
