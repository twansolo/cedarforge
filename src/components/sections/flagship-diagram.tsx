"use client";

import { motion } from "framer-motion";

import { flagshipStages } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Attract -> Convert -> Automate -> Compound.
 *
 * A closed loop rather than a linear chain: the last stage feeds the first,
 * which is the point of the flagship engine. Rendered as an instrument rail so
 * the labels stay real text and readable at 375px.
 */
export function FlagshipDiagram() {
  return (
    <div className="relative border border-muted-steel/30 bg-forge-black/60">
      <div aria-hidden="true" className="absolute inset-0 grid-instrument opacity-30" />

      <div className="relative p-5 sm:p-6">
        <p className="label-technical text-steel-text">System loop</p>

        {/*
         * Stage names are single unbreakable words, so cells only go four-across
         * once there is genuinely room. Below that they stack, which keeps the
         * labels at full size instead of clipping them.
         */}
        <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          {flagshipStages.map((stage, index) => (
            <motion.li
              key={stage}
              className="relative flex items-center gap-3 xl:flex-col xl:items-start xl:gap-0 xl:px-4 xl:first:pl-0 xl:last:pr-0"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: index * 0.12, ease }}
            >
              {/* Connector to the next stage */}
              {index < flagshipStages.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-[7px] hidden h-px w-full bg-muted-steel/35 xl:block"
                />
              ) : null}

              <span
                aria-hidden="true"
                className="relative z-10 flex size-3.5 shrink-0 items-center justify-center rounded-full border border-signal-green/50 bg-forge-black xl:mb-4"
              >
                <span
                  className="size-1 rounded-full bg-signal-green"
                  style={{
                    animation: `signal-pulse 2.6s ease-in-out ${index * 0.4}s infinite`,
                  }}
                />
              </span>

              <span className="text-base font-semibold tracking-tight text-workshop-white">
                {stage}
              </span>
            </motion.li>
          ))}
        </ol>

        {/* Return path closing the loop */}
        <div className="mt-5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-gradient-to-r from-signal-green/50 to-muted-steel/20"
          />
          <p className="label-technical text-steel-text">
            Compound feeds attract
          </p>
        </div>
      </div>
    </div>
  );
}
