"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ButtonLink } from "@/components/ui/button";
import { useActiveSection } from "@/hooks/use-active-section";
import { navigation, primaryCta, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Only entries that own a section participate in scroll tracking. "Solutions"
 * shares the Pricing anchor and deliberately has no activeId, so a single item
 * highlights at a time.
 */
const sectionIds: readonly string[] = navigation.flatMap((item) =>
  "activeId" in item ? [item.activeId] : [],
);

/**
 * The brand lockup arrives as a prop rather than being imported here.
 * `BrandLockup` inlines an SVG it reads from disk, which makes it an async
 * server component, and this header is a client component for the scroll and
 * menu state. Passing the rendered node in from the layout keeps both.
 */
export function Header({ lockup }: { lockup: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeId = useActiveSection(sectionIds);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Hairline strengthens once the header lifts off the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes, and focus stays inside the panel while it is open.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-forge-black/90 backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-muted-steel/25" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/*
         * No vertical padding: the lockup is 56px tall on its own, which clears
         * the 44px minimum target and keeps the link inside the 72px bar.
         */}
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="flex shrink-0 items-center"
        >
          {lockup}
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center">
            {navigation.map((item) => {
              const itemActiveId = "activeId" in item ? item.activeId : undefined;
              const isActive = Boolean(itemActiveId) && activeId === itemActiveId;

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative px-3 py-2.5 text-[0.875rem] font-medium transition-colors duration-200",
                      isActive
                        ? "text-workshop-white"
                        : "text-steel-text hover:text-workshop-white",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 -bottom-px h-px origin-left bg-signal-green transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink
            href={primaryCta.href}
            size="sm"
            className="hidden sm:inline-flex"
          >
            {primaryCta.label}
          </ButtonLink>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center border border-muted-steel/35 text-workshop-white transition-colors hover:border-signal-green hover:text-signal-green xl:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-muted-steel/25 bg-forge-black xl:hidden"
          >
            <nav aria-label="Mobile" className="px-5 pb-8 pt-4 sm:px-8">
              <ul className="flex flex-col">
                {navigation.map((item) => (
                  <li key={item.label} className="border-b border-muted-steel/15">
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={
                        "activeId" in item && activeId === item.activeId
                          ? "true"
                          : undefined
                      }
                      className={cn(
                        "flex items-center justify-between py-4 text-lg font-semibold tracking-tight transition-colors",
                        "activeId" in item && activeId === item.activeId
                          ? "text-signal-green"
                          : "text-workshop-white hover:text-signal-green",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={primaryCta.href}
                onClick={closeMenu}
                className="mt-6 w-full"
              >
                {primaryCta.label}
              </ButtonLink>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
