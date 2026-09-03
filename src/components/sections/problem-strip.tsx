import { problemStatements } from "@/lib/site";

export function ProblemStrip() {
  return (
    <section aria-label="Common constraints" className="bg-cedar-green">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <ul className="grid grid-cols-1 gap-y-5 sm:grid-cols-3 sm:gap-y-0">
          {problemStatements.map((statement, index) => (
            <li
              key={statement}
              // Hairline separators instead of decorative icons.
              className={
                index > 0
                  ? "border-t border-workshop-white/25 pt-5 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0"
                  : "sm:pr-8"
              }
            >
              <p className="text-subhead font-bold text-workshop-white">
                {statement}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
