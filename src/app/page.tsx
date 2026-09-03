import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { LocalRoots } from "@/components/sections/local-roots";
import { Outcomes } from "@/components/sections/outcomes";
import { ProblemStrip } from "@/components/sections/problem-strip";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";

/*
 * Single-page composition. Each section owns its own content and anchor, so any
 * one of them can move to a dedicated route (/services, /process, /contact)
 * without touching the others.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemStrip />
      <Services />
      <Outcomes />
      <Process />
      <LocalRoots />
      <Contact />
    </>
  );
}
