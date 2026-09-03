import { BrandLockup } from "@/components/layout/brand-lockup";
import { ContactForm } from "@/components/sections/contact-form";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { siteConfig } from "@/lib/site";

/**
 * Server shell for the contact section. Owns the heading, copy, and the brand
 * lockup so those stay out of the client bundle; only the form itself is
 * interactive.
 */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-20 bg-workshop-white text-forge-black"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <TechnicalLabel index="05" tone="light">
              Start here
            </TechnicalLabel>
            <h2
              id="contact-heading"
              className="mt-6 text-headline font-extrabold text-balance-tight"
            >
              Let&rsquo;s find your highest-value move.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-forge-black/70">
              Tell us where growth feels stuck. We&rsquo;ll come to the first
              conversation ready with questions—not a canned pitch.
            </p>
          </div>

          <div className="border border-forge-black/15 bg-workshop-white">
            {/*
             * Letterhead. The primary lockup's artboard is Workshop White, so it
             * sits flush on this panel.
             */}
            <div className="border-b border-forge-black/12 px-6 py-5 sm:px-9">
              <BrandLockup
                variant="primary"
                label={`${siteConfig.name} — ${siteConfig.tagline}`}
                className="h-11 sm:h-12"
              />
            </div>

            <div className="p-6 sm:p-9">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
