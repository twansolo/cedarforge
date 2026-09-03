import { Minus, Plus } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { qualification } from "@/lib/site";

const columns = [
  {
    id: "fit",
    heading: "Cedar Forge is a strong fit when:",
    items: qualification.fit,
    icon: Plus,
    accent: "text-cedar-ink",
    rule: "bg-cedar-green",
  },
  {
    id: "not-fit",
    heading: "It may not be the right fit when:",
    items: qualification.notFit,
    icon: Minus,
    accent: "text-forge-black/45",
    rule: "bg-forge-black/25",
  },
] as const;

export function Qualification() {
  return (
    <section
      aria-labelledby="qualification-heading"
      className="bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <TechnicalLabel index="04" tone="light">
              Fit assessment
            </TechnicalLabel>
            <h2
              id="qualification-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight"
            >
              Built for businesses ready to improve the system—not add another
              tool.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 items-start gap-px border border-forge-black/15 bg-forge-black/15 lg:mt-14 lg:grid-cols-2">
          {columns.map((column, index) => (
            <Reveal
              key={column.id}
              delay={index * 0.08}
              className="h-full bg-workshop-white p-7 sm:p-9"
            >
              <span
                aria-hidden="true"
                className={`block h-0.5 w-10 ${column.rule}`}
              />
              <h3 className="mt-6 text-xl font-bold tracking-tight sm:text-[1.375rem]">
                {column.heading}
              </h3>

              <ul className="mt-6 border-t border-forge-black/12">
                {column.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 border-b border-forge-black/12 py-3.5"
                  >
                    <column.icon
                      aria-hidden="true"
                      className={`mt-1 size-3.5 shrink-0 ${column.accent}`}
                      strokeWidth={2.5}
                    />
                    <span className="leading-snug text-forge-black/85">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
