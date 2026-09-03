import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { LocalRoots } from "@/components/sections/local-roots";
import { OfferSystem } from "@/components/sections/offer-system";
import { Outcomes } from "@/components/sections/outcomes";
import { Pricing } from "@/components/sections/pricing";
import { ProblemStrip } from "@/components/sections/problem-strip";
import { Process } from "@/components/sections/process";
import { Qualification } from "@/components/sections/qualification";
import { SystemsCare } from "@/components/sections/systems-care";

/*
 * Single-page composition. Each section owns its own content and anchor, so any
 * one of them can move to a dedicated route (/solutions, /pricing, /contact)
 * without touching the others.
 *
 * Surfaces alternate Forge Black and Workshop White so the offer system, the
 * flagship panel, and Systems Care each read as distinct assemblies.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemStrip />
      <OfferSystem />
      <Pricing />
      <SystemsCare />
      <Qualification />
      <Outcomes />
      <Process />
      <LocalRoots />
      <Contact />
    </>
  );
}
