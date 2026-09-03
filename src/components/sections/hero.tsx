"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { GrowthSystem } from "@/components/sections/growth-system";
import { ButtonLink } from "@/components/ui/button";
import { heroPriceNote } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Sequenced reveal on load. The prop shape is the same for everyone; the
 * reduced-motion policy in MotionProvider removes the travel and leaves a fade.
 */
const step = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-muted-steel/20 bg-forge-black"
    >
      {/* Architectural grid and a controlled pool of cedar light. */}
      <div aria-hidden="true" className="absolute inset-0 grid-fine opacity-60" />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-cedar-green/12 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-forge-black"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-[104px] sm:px-8 sm:pb-20 sm:pt-32 lg:px-12 lg:pb-28 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* Copy */}
          <div>
            <motion.p
              {...step(0)}
              className="label-technical flex flex-wrap items-center gap-x-2 gap-y-1 text-steel-text"
            >
              <span className="text-signal-green">Cedar Rapids, Iowa</span>
              <span aria-hidden="true" className="text-steel-text/50">
                ·
              </span>
              <span>AI Growth Partner</span>
            </motion.p>

            <motion.h1
              {...step(0.1)}
              id="hero-heading"
              className="mt-6 text-display font-extrabold text-balance-tight text-workshop-white"
            >
              Your business should work smarter.
            </motion.h1>

            <motion.p
              {...step(0.2)}
              className="mt-7 max-w-xl text-lg leading-relaxed text-steel-text sm:text-xl"
            >
              We connect AI automation, a high-performing website, and local
              search into one practical growth system—built around how your
              business actually runs.
            </motion.p>

            <motion.div {...step(0.3)} className="mt-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="#contact" className="group">
                  Start With a Growth Map
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </ButtonLink>
                <ButtonLink href="#what-we-build" variant="secondary">
                  Explore the System
                </ButtonLink>
              </div>

              {/* Qualifying line: sets the entry point without leading on price. */}
              <p className="mt-5 flex items-center gap-2.5 text-base text-steel-text">
                <span
                  aria-hidden="true"
                  className="h-px w-4 shrink-0 bg-muted-steel/60"
                />
                {heroPriceNote}
              </p>
            </motion.div>
          </div>

          {/* Growth engine visualization */}
          <motion.div {...step(0.35)}>
            <GrowthSystem />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
