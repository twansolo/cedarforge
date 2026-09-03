"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Everything that can hold focus inside the dialog. Matches the query used by
 * the header's mobile menu, widened for form controls.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type Props = {
  open: boolean;
  onClose: () => void;
  /** id of the heading that names the dialog. */
  labelledBy: string;
  /** Accessible name for the close control. */
  closeLabel?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Accessible dialog, rendered into `document.body` so no ancestor's overflow,
 * transform, or stacking context can clip it.
 *
 * Follows the same rules as the header's mobile menu: Escape closes, Tab cycles
 * inside the panel, the page behind cannot scroll, and focus returns to whatever
 * opened it. Motion props are unconditional; MotionProvider's
 * `reducedMotion="user"` drops the travel for visitors who asked for less.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  closeLabel = "Close",
  children,
  className,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement;
    restoreRef.current =
      opener instanceof HTMLElement && opener !== document.body ? opener : null;

    /*
     * Focus the panel rather than the first field: it announces the dialog and
     * its heading, gives the panel keyboard scrolling, and avoids throwing up a
     * mobile keyboard the moment the popup appears.
     *
     * `preventScroll` matters. A panel taller than the viewport would otherwise
     * be scrolled into view end-first, putting the heading and the offer above
     * the top edge.
     */
    const frame = window.requestAnimationFrame(() =>
      panelRef.current?.focus({ preventScroll: true }),
    );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
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
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;

      // Only restore focus if the opener is still on the page.
      if (restoreRef.current?.isConnected) {
        restoreRef.current.focus();
      }
    };
  }, [open, onClose]);

  // Clicks on the backdrop itself close; clicks inside the panel bubble through it.
  const onBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  /*
   * Portals need a DOM. Nothing renders on the server, and `open` is always
   * false on the first client render, so the portal starts empty and there is no
   * markup for hydration to disagree about.
   */
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease }}
          onClick={onBackdropClick}
          /*
           * The backdrop is also the scroll container, so a panel taller than the
           * viewport scrolls as a whole instead of needing a nested scroll area.
           * Placement is left to auto margins on the panel: `items-end` or
           * `items-center` here would push overflow past the top of the scroll
           * range, where it can never be scrolled back into view.
           */
          className="fixed inset-0 z-[80] flex justify-center overflow-y-auto overscroll-contain bg-forge-black/85 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            key="modal-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, delay: 0.04, ease }}
            className={cn(
              /*
               * Auto margins do the placement: a sheet against the bottom edge on
               * phones, centred from `sm` up, and both resolve to zero once the
               * panel is taller than the viewport so every edge stays reachable.
               */
              "relative mt-auto w-full border border-muted-steel/30 bg-workshop-white shadow-2xl shadow-forge-black/40 focus-visible:outline-none sm:my-auto",
              className,
            )}
          >
            {/* Cedar rule, the same marker used on the entry offer panel. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-1 bg-cedar-green"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute right-3 top-4 z-10 inline-flex size-9 items-center justify-center border border-forge-black/15 bg-workshop-white text-forge-black transition-colors duration-200 hover:border-cedar-green hover:text-cedar-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>

            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
