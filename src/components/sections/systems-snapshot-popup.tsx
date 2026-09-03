"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { SnapshotForm } from "@/components/sections/snapshot-form";
import { IncludeList, OfferNote } from "@/components/ui/include-list";
import { Modal } from "@/components/ui/modal";
import { TechnicalLabel } from "@/components/ui/technical-label";
import { systemsSnapshot } from "@/lib/site";

/** Fires the popup from anywhere: `window.dispatchEvent(new Event(...))`. */
export const SNAPSHOT_OPEN_EVENT = "cedarforge:open-systems-snapshot";

/** Opens the Systems Snapshot popup on demand, e.g. from a text link. */
export function openSystemsSnapshot() {
  window.dispatchEvent(new Event(SNAPSHOT_OPEN_EVENT));
}

const DISMISSED_KEY = "cf:snapshot-dismissed";
const REQUESTED_KEY = "cf:snapshot-requested";

/** How long a dismissal suppresses the popup. */
const SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;
/** Time on page before the popup appears unprompted. */
const DELAY_MS = 25_000;
/** Share of the page that has to be read instead of waiting out the timer. */
const SCROLL_DEPTH = 0.5;

/** localStorage throws in some privacy modes, so every access is guarded. */
function readStore(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the popup simply reappears on the next visit.
  }
}

function suppressed() {
  if (readStore(REQUESTED_KEY)) return true;

  const dismissedAt = Number(readStore(DISMISSED_KEY));
  return Boolean(dismissedAt) && Date.now() - dismissedAt < SUPPRESS_MS;
}

/**
 * True while the contact section is on screen. Someone already filling in the
 * Growth Map form does not need an interruption offering a smaller step.
 */
function contactInView() {
  const contact = document.getElementById("contact");
  if (!contact) return false;

  const { top, bottom } = contact.getBoundingClientRect();
  return top < window.innerHeight && bottom > 0;
}

function scrolledPast(share: number) {
  const scrollable =
    document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return false;

  return window.scrollY / scrollable >= share;
}

/**
 * The free entry point, delivered as a popup.
 *
 * Appears once per visitor per month: after time on page, after half the page is
 * read, or on exit intent, whichever lands first. A dismissal is remembered for
 * 30 days; a submitted request is remembered for good. It never interrupts the
 * contact form, and it never opens before a visitor has had a chance to read
 * anything.
 */
export function SystemsSnapshotPopup() {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  /** Guards against reopening automatically once it has been shown. */
  const shown = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    writeStore(DISMISSED_KEY, String(Date.now()));
  }, []);

  const onRequested = useCallback(() => {
    writeStore(REQUESTED_KEY, String(Date.now()));
  }, []);

  // Manual triggers, for links and buttons elsewhere on the page.
  useEffect(() => {
    const onOpen = () => {
      shown.current = true;
      setOpen(true);
    };

    window.addEventListener(SNAPSHOT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SNAPSHOT_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (shown.current || suppressed()) return;

    let timer = 0;

    const stop = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
    };

    const trigger = () => {
      if (shown.current) return;

      /*
       * Bail without tearing down the listeners: the visitor is in the contact
       * form right now, but a later scroll or exit can still bring this up.
       */
      if (contactInView()) return;

      shown.current = true;
      stop();
      setOpen(true);
    };

    function onScroll() {
      if (scrolledPast(SCROLL_DEPTH)) trigger();
    }

    /** Exit intent: pointer leaves through the top of the viewport. */
    function onMouseOut(event: globalThis.MouseEvent) {
      if (event.relatedTarget === null && event.clientY <= 0) trigger();
    }

    timer = window.setTimeout(trigger, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onMouseOut);

    return stop;
  }, []);

  return (
    <Modal
      open={open}
      onClose={close}
      labelledBy={headingId}
      closeLabel="Close the Systems Snapshot offer"
      className="max-w-[58rem]"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ---- The offer ------------------------------------------------- */}
        <div className="relative overflow-hidden bg-forge-black p-7 pr-16 sm:p-9 sm:pr-20 lg:pr-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 grid-fine opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute -top-28 -left-16 h-[320px] w-[420px] rounded-full bg-cedar-green/16 blur-[110px]"
          />

          <div className="relative">
            <p className="label-technical inline-flex items-center gap-2 border border-signal-green/40 px-2.5 py-1.5 text-signal-green">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-signal-green"
                style={{ animation: "signal-pulse 2.8s ease-in-out infinite" }}
              />
              {systemsSnapshot.eyebrow}
            </p>

            <h2
              id={headingId}
              className="mt-6 text-[1.75rem] font-extrabold leading-[1.06] tracking-tight text-balance-tight text-workshop-white sm:text-[2.125rem]"
            >
              {systemsSnapshot.headline}
            </h2>

            <p className="mt-5 leading-relaxed text-steel-text">
              {systemsSnapshot.description}
            </p>

            <div className="mt-7">
              <TechnicalLabel>What you leave with</TechnicalLabel>
              <IncludeList
                items={systemsSnapshot.deliverables}
                label={`${systemsSnapshot.name} findings`}
                tone="dark"
                className="mt-3"
              />
            </div>

            <OfferNote tone="dark" className="mt-6 text-[0.9375rem]">
              {systemsSnapshot.note}
            </OfferNote>
          </div>
        </div>

        {/* ---- The request ----------------------------------------------- */}
        <div className="bg-workshop-white p-6 text-forge-black sm:p-9">
          <SnapshotForm onSuccess={onRequested} onDone={() => setOpen(false)} />
        </div>
      </div>
    </Modal>
  );
}
