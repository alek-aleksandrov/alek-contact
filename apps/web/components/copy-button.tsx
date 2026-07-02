"use client";

import { type ReactNode, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Copies `value` to the clipboard on click and swaps its content to a
 * confirmation for ~1.5s. Styling is entirely via `className` so it can render
 * as a pill button, an icon button, or a chip.
 */
export function CopyButton({
  value,
  children,
  copiedLabel = "Copied",
  className,
}: {
  value: string;
  children: ReactNode;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${value}`}
      data-copied={copied}
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4 shrink-0" />
          {copiedLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
