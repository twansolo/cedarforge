import Image from "next/image";

import { FlagshipDiagram } from "@/components/sections/flagship-diagram";
import { ButtonLink } from "@/components/ui/button";
import { IncludeList, OfferNote } from "@/components/ui/include-list";
import { PriceBlock } from "@/components/ui/price-block";
import { Reveal } from "@/components/ui/reveal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { entryOffer, flagshipOffer, focusedOffers } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <Reveal>
          <div className="max-w-3xl">
            <TechnicalLabel index="02" tone="light">
              Solutions &amp; investment
            </TechnicalLabel>
            <h2
              id="pricing-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight"
            >
              Practical systems. Clear starting points.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-forge-black/70">
              Choose a focused implementation or connect the pieces into a
              complete growth engine. Final pricing depends on complexity,
              integrations, content, and the measurable value of the opportunity.
            </p>
          </div>
        </Reveal>

        {/* ---- Entry offer ------------------------------------------------ */}
        <Reveal className="mt-14 lg:mt-16">
          <article className="relative border border-forge-black/20 bg-fresh-cut/45">
            {/* Cedar rule marking the recommended entry point */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-cedar-green"
            />

            <div className="grid gap-10 p-7 sm:p-9 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14 lg:p-11">
              <div>
                <p className="label-technical inline-flex items-center gap-2 border border-cedar-ink/35 bg-workshop-white/70 px-2.5 py-1.5 text-cedar-ink">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-cedar-ink"
                  />
                  {entryOffer.flag}
                </p>

                <h3 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {entryOffer.name}
                </h3>

                <PriceBlock
                  price={entryOffer.price}
                  priceKind={entryOffer.priceKind}
                  size="lg"
                  className="mt-6"
                />

                <p className="mt-5 max-w-md leading-relaxed text-forge-black/75">
                  {entryOffer.description}
                </p>

                <ButtonLink href="#contact" className="mt-7 w-full sm:w-auto">
                  {entryOffer.ctaLabel}
                </ButtonLink>

                {entryOffer.note ? (
                  <OfferNote className="mt-6 max-w-md">
                    {entryOffer.note}
                  </OfferNote>
                ) : null}
              </div>

              <div>
                <p className="label-technical text-forge-black/55">
                  What it includes
                </p>
                <IncludeList
                  items={entryOffer.includes}
                  label={`${entryOffer.name} scope`}
                  columns={2}
                  className="mt-4"
                />
              </div>
            </div>
          </article>
        </Reveal>

        {/* ---- Focused implementations ------------------------------------ */}
        <div className="mt-6">
          <p className="label-technical text-forge-black/55">
            Focused implementations
          </p>

          {/*
           * items-start keeps each panel at its natural height. The AI sprint
           * carries an extra list, and stretching the others to match would
           * leave large dead areas.
           */}
          <ul className="mt-4 grid grid-cols-1 items-start border-t border-forge-black/20 lg:grid-cols-3">
            {focusedOffers.map((offer, index) => (
              <Reveal
                as="li"
                key={offer.id}
                delay={index * 0.08}
                className={cn(
                  "group flex h-full flex-col border-b border-forge-black/20 p-7 transition-colors duration-300 sm:p-8",
                  index > 0 && "lg:border-l lg:border-forge-black/20",
                  "hover:bg-forge-black/[0.035]",
                )}
              >
                <span
                  aria-hidden="true"
                  className="mb-6 h-0.5 w-full origin-left scale-x-0 bg-cedar-green transition-transform duration-300 group-hover:scale-x-100"
                />

                <p className="label-technical text-forge-black/45">
                  {offer.index}
                </p>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">
                  {offer.name}
                </h3>

                <PriceBlock
                  price={offer.price}
                  priceKind={offer.priceKind}
                  className="mt-5"
                />

                <p className="mt-5 leading-relaxed text-forge-black/70">
                  {offer.description}
                </p>

                <IncludeList
                  items={offer.includes}
                  label={`${offer.name} scope`}
                  className="mt-7"
                />

                {offer.examples ? (
                  <div className="mt-7">
                    <p className="label-technical text-forge-black/55">
                      {offer.examples.title}
                    </p>
                    <ul className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
                      {offer.examples.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-baseline gap-2.5 py-1"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1 shrink-0 rounded-full bg-forge-black/35"
                          />
                          <span className="text-base leading-snug text-forge-black/70">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {offer.note ? (
                  <OfferNote className="mt-6">{offer.note}</OfferNote>
                ) : null}

                {/* mt-auto pins the action to the panel base without stretching copy. */}
                <ButtonLink
                  href="#contact"
                  variant="ghost"
                  className="mt-8 w-full"
                >
                  {offer.ctaLabel}
                </ButtonLink>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* ---- Flagship --------------------------------------------------- */}
        <Reveal className="mt-16 lg:mt-20">
          <article className="relative overflow-hidden border border-muted-steel/30 bg-forge-black">
            <div
              aria-hidden="true"
              className="absolute inset-0 grid-fine opacity-50"
            />
            {/* Controlled signal illumination behind the monogram */}
            <div
              aria-hidden="true"
              className="absolute -top-32 left-0 h-[420px] w-[620px] rounded-full bg-cedar-green/14 blur-[120px]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cedar-green via-signal-green to-cedar-green"
            />

            <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-14">
              <div>
                <div className="flex items-center gap-4">
                  <Image
                    src="/Cedar-Forge-Icon.svg"
                    alt=""
                    aria-hidden="true"
                    width={44}
                    height={44}
                    className="size-10 sm:size-11"
                  />
                  <p className="label-technical inline-flex items-center gap-2 border border-signal-green/40 px-2.5 py-1.5 text-signal-green">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-signal-green"
                      style={{
                        animation: "signal-pulse 2.8s ease-in-out infinite",
                      }}
                    />
                    {flagshipOffer.flag}
                  </p>
                </div>

                <h3 className="mt-7 text-[2rem] font-extrabold leading-[1.05] tracking-tight text-workshop-white sm:text-[2.5rem]">
                  {flagshipOffer.name}
                </h3>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-steel-text">
                  {flagshipOffer.description}
                </p>

                <PriceBlock
                  price={flagshipOffer.price}
                  priceKind={flagshipOffer.priceKind}
                  ongoingPrice={flagshipOffer.ongoingPrice}
                  tone="dark"
                  size="lg"
                  className="mt-8"
                />

                <ButtonLink href="#contact" className="mt-8 w-full sm:w-auto">
                  {flagshipOffer.ctaLabel}
                </ButtonLink>
              </div>

              <div className="flex flex-col gap-8">
                <div>
                  <p className="label-technical text-steel-text">
                    What it includes
                  </p>
                  <IncludeList
                    items={flagshipOffer.includes}
                    label={`${flagshipOffer.name} scope`}
                    tone="dark"
                    className="mt-4"
                  />
                </div>

                <FlagshipDiagram />
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
