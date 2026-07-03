"use client";

import { HORIZONS, useHorizon } from "@/components/dashboard/horizon-context";
import { cn } from "@/lib/utils";

export function HorizonToggle() {
  const { horizon, setHorizon } = useHorizon();
  return (
    <div className="inline-flex rounded-lg border border-border/60 p-0.5">
      {HORIZONS.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => setHorizon(h.id)}
          aria-pressed={horizon === h.id}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
            horizon === h.id
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}
