"use client";

import { useState, type ComponentProps } from "react";

import { AskConsole } from "@/components/console/ask-console";
import { cn } from "@/lib/utils";

/**
 * The dashboard console as a floating widget: a corner launcher that expands a
 * panel, so the console stays out of the content flow (letting the data grid go
 * full-width) without any sticky/transform layout artifacts.
 */
export function FloatingConsole(props: ComponentProps<typeof AskConsole>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask about the dashboard"
        className={cn(
          "fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-mono text-sm font-medium text-foreground shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/20 backdrop-blur transition-all hover:bg-emerald-500/20 hover:shadow-emerald-500/25",
          open && "hidden",
        )}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        Ask the dashboard
      </button>

      {open ? (
        <div className="fixed right-6 bottom-6 z-50 w-[min(400px,calc(100vw-2rem))]">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close console"
              className="rounded-full border border-border bg-background/90 px-2 py-1 font-mono text-xs shadow backdrop-blur transition-colors hover:border-foreground/30"
            >
              close ✕
            </button>
          </div>
          <div className="rounded-xl shadow-2xl">
            <AskConsole {...props} />
          </div>
        </div>
      ) : null}
    </>
  );
}
