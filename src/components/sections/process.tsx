"use client";

import { motion } from "framer-motion";

import { TechnicalLabel } from "@/components/ui/technical-label";
import { processStages } from "@/lib/site";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Process() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="process-heading"
      className="scroll-mt-20 bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="max-w-3xl">
          <TechnicalLabel index="03" tone="light">
            How it works
          </TechnicalLabel>
          <h2
            id="process-heading"
            className="mt-6 text-headline font-extrabold text-balance-tight"
          >
            Clarity before complexity.
          </h2>
        </div>

        <div className="relative mt-16">
          {/*
           * Connector showing progression. It is decorative: the stage content
           * below is never hidden behind it.
           */}
          <div
            aria-hidden="true"
            className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-px bg-forge-black/12 lg:left-0 lg:top-[19px] lg:h-px lg:w-full"
          >
            <motion.div
              className="size-full origin-top bg-cedar-green lg:origin-left"
              initial={{ scaleY: 0, scaleX: 1 }}
              whileInView={{ scaleY: 1, scaleX: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 1.1, ease }}
            />
          </div>

          <ol className="grid grid-cols-1 gap-y-12 lg:grid-cols-3 lg:gap-x-10">
            {processStages.map((stage, index) => (
              <motion.li
                key={stage.index}
                className="relative pl-14 lg:pl-0"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.14,
                  ease,
                }}
              >
                {/* Stage node sitting on the connector */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0 flex size-10 items-center justify-center",
                    "border border-forge-black/15 bg-workshop-white",
                    "lg:relative lg:mb-7 lg:flex",
                  )}
                >
                  <span className="label-technical text-cedar-ink">
                    {stage.index}
                  </span>
                </span>

                <h3 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {stage.name}
                </h3>
                <p className="mt-2 text-lg font-medium text-cedar-ink">
                  {stage.summary}
                </p>
                <p className="mt-4 max-w-md leading-relaxed text-forge-black/70">
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
