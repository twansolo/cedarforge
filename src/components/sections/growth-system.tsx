"use client";

import { motion } from "framer-motion";
import { Globe, Search, Settings2, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Node = {
  id: string;
  label: string;
  meta: string;
  icon: LucideIcon;
  /** Position in the shared 0-100 coordinate space. */
  x: number;
  y: number;
  /** Cubic path from the hub out to this node. */
  path: string;
  delay: number;
};

/*
 * The SVG and the HTML nodes share one 0-100 coordinate space. The SVG uses
 * preserveAspectRatio="none" so its paths stretch exactly with the container,
 * which keeps the connection lines locked to the percentage-positioned nodes at
 * every aspect ratio. Strokes stay even via vectorEffect="non-scaling-stroke".
 * Labels are real HTML, so they never shrink to unreadable sizes on mobile.
 */
const nodes: Node[] = [
  {
    id: "web",
    label: "Web",
    meta: "Front door",
    icon: Globe,
    x: 16,
    y: 18,
    path: "M 50 50 C 40 42, 31 24, 21 19",
    delay: 0,
  },
  {
    id: "search",
    label: "Search",
    meta: "Local demand",
    icon: Search,
    x: 84,
    y: 18,
    path: "M 50 50 C 60 42, 69 24, 79 19",
    delay: 0.12,
  },
  {
    id: "leads",
    label: "Leads",
    meta: "Qualified intent",
    icon: Users,
    x: 84,
    y: 82,
    path: "M 50 50 C 60 58, 69 76, 79 81",
    delay: 0.24,
  },
  {
    id: "operations",
    label: "Operations",
    meta: "Delivery",
    icon: Settings2,
    x: 16,
    y: 82,
    path: "M 50 50 C 40 58, 31 76, 21 81",
    delay: 0.36,
  },
];

const stages = [
  { index: "01", name: "Attract", detail: "Search and site pull the right demand" },
  { index: "02", name: "Convert", detail: "Visitors become qualified conversations" },
  { index: "03", name: "Automate", detail: "Follow-up and delivery run themselves" },
];

export function GrowthSystem() {
  return (
    <div className="relative border border-muted-steel/25 bg-steel-900/70">
      {/* Instrument panel header */}
      <div className="flex items-center justify-between gap-4 border-b border-muted-steel/25 px-4 py-3 sm:px-5">
        <p className="label-technical text-steel-text">Growth Engine</p>
        <p className="label-technical flex items-center gap-2 text-signal-green">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-signal-green [animation:signal-pulse_2.8s_ease-in-out_infinite]"
          />
          Live
        </p>
      </div>

      {/* Diagram */}
      <div className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[16/9]">
        <div aria-hidden="true" className="absolute inset-0 grid-instrument opacity-40" />

        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Structural crosshairs */}
          <g stroke="currentColor" className="text-steel-text/25">
            <line
              x1="50"
              y1="6"
              x2="50"
              y2="94"
              strokeWidth="1"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="6"
              y1="50"
              x2="94"
              y2="50"
              strokeWidth="1"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {nodes.map((node) => (
            <g key={node.id}>
              {/* Static conduit */}
              <motion.path
                d={node.path}
                fill="none"
                stroke="currentColor"
                className="text-cedar-green"
                strokeWidth="1.5"
                strokeOpacity="0.75"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 1.1,
                  delay: 0.35 + node.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
              {/* Travelling signal */}
              <path
                d={node.path}
                fill="none"
                stroke="currentColor"
                className="text-signal-green"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeDasharray="3 25"
                vectorEffect="non-scaling-stroke"
                style={{
                  animation: `signal-dash 2.6s linear ${node.delay}s infinite`,
                }}
              />
            </g>
          ))}
        </svg>

        {/* Hub */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex size-[86px] items-center justify-center rounded-full border border-signal-green/45 bg-forge-black sm:size-[104px]">
            <span
              aria-hidden="true"
              className="absolute inset-[-9px] rounded-full border border-dashed border-muted-steel/35"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[-9px] rounded-full border border-signal-green/25"
              style={{ animation: "signal-pulse 4s ease-in-out infinite" }}
            />
            <span className="flex flex-col items-center gap-1">
              <Sparkles
                aria-hidden="true"
                className="size-4 text-signal-green sm:size-[18px]"
              />
              <span className="text-lg font-extrabold tracking-[0.14em] text-workshop-white sm:text-xl">
                AI
              </span>
            </span>
          </div>
        </motion.div>

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.5 + node.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex items-center gap-2 border border-muted-steel/35 bg-forge-black/95 px-2.5 py-2 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
              <node.icon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-cedar-green sm:size-4"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-[0.8125rem] font-semibold tracking-tight text-workshop-white sm:text-sm">
                  {node.label}
                </span>
                <span className="label-technical mt-1 hidden text-[0.5625rem] text-steel-text sm:block">
                  {node.meta}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="ml-0.5 size-1.5 shrink-0 rounded-full bg-signal-green"
                style={{
                  animation: `signal-pulse 2.8s ease-in-out ${node.delay}s infinite`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stage rail */}
      <ul className="grid grid-cols-1 border-t border-muted-steel/25 sm:grid-cols-3">
        {stages.map((stage, index) => (
          <li
            key={stage.index}
            className={cn(
              "px-4 py-4 sm:px-5",
              index > 0 &&
                "border-t border-muted-steel/20 sm:border-t-0 sm:border-l",
            )}
          >
            <p className="label-technical flex items-center gap-2">
              <span className="text-signal-green">{stage.index}</span>
              <span className="text-workshop-white">{stage.name}</span>
            </p>
            <p className="mt-2 text-[0.8125rem] leading-snug text-steel-text">
              {stage.detail}
            </p>
          </li>
        ))}
      </ul>

      {/* Text alternative for assistive technology. */}
      <p className="sr-only">
        Diagram: an AI core at the center connects four parts of the business,
        Web, Search, Leads, and Operations, across three stages. Attract, where
        search and the site pull in the right demand. Convert, where visitors
        become qualified conversations. Automate, where follow-up and delivery
        run themselves.
      </p>
    </div>
  );
}
