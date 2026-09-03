import Image from "next/image";
import Link from "next/link";

import { navigation, siteConfig } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-muted-steel/25 bg-forge-black">
      <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            {/*
             * The supplied dark horizontal lockup. Its artboard is Forge Black,
             * so it sits flush on this surface.
             */}
            <Image
              src="/Cedar-Forge-Logo-Dark.svg"
              alt={`${siteConfig.name} — ${siteConfig.tagline}`}
              width={1280}
              height={320}
              className="h-16 w-auto sm:h-20"
            />
            <p className="label-technical mt-6 text-steel-text">
              {siteConfig.locality}, {siteConfig.regionName}
            </p>
          </div>

          <nav aria-label="Footer" className="lg:min-w-56">
            <p className="label-technical text-steel-text">Navigate</p>
            <ul className="mt-5 flex flex-col gap-3">
              {navigation.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="text-[0.9375rem] font-medium text-workshop-white transition-colors hover:text-signal-green"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="#contact"
                  className="text-[0.9375rem] font-medium text-workshop-white transition-colors hover:text-signal-green"
                >
                  Get Your Growth Map
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-muted-steel/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-technical text-steel-text">
            &copy; {year} {siteConfig.name}
          </p>
          <a
            href={siteConfig.url}
            className="label-technical text-steel-text transition-colors hover:text-signal-green"
          >
            {siteConfig.domain}
          </a>
        </div>
      </div>
    </footer>
  );
}
