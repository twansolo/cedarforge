"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * The deliverable, with a copy button.
 *
 * The only client component in the tool. Everything else on the page is server
 * rendered; this needs the clipboard API, and the fallback matters: if the copy
 * fails, or the browser withholds permission, the text is already on screen in a
 * selectable block.
 */
export function CopyBrief({ brief }: { brief: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reverts the confirmation without leaving a timer behind on unmount.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2_400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setFailed(false);
      setCopied(true);
    } catch {
      setFailed(true);
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm" onClick={copy} className="group">
          {copied ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden="true" className="size-4" />
              Copy brief
            </>
          )}
        </Button>

        <p
          role="status"
          aria-live="polite"
          className="text-[0.8125rem] text-steel-text"
        >
          {copied
            ? "Plain text, on the clipboard."
            : failed
              ? "The clipboard was blocked. Select the text below and copy it manually."
              : `${brief.split("\n").length} lines, ready to paste into the follow-up.`}
        </p>
      </div>

      <pre className="max-h-[32rem] overflow-auto border border-muted-steel/25 bg-steel-900 p-5 font-mono text-[0.8125rem] leading-relaxed text-steel-text">
        {brief}
      </pre>
    </div>
  );
}
