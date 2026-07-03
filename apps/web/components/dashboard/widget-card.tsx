import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WidgetCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/40 p-5",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-heading text-sm font-medium">{title}</h3>
        {subtitle ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

export function StatRow({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "up" | "down" | "flag";
}) {
  const accentCls =
    accent === "up"
      ? "text-emerald-500"
      : accent === "down"
        ? "text-red-500"
        : accent === "flag"
          ? "text-amber-500"
          : "text-foreground";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className={cn("font-mono text-sm tabular-nums", accentCls)}>
          {value}
        </span>
        {hint ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}
