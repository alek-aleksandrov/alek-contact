"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const META = {
  pass: { label: "PASS", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" },
  fail: { label: "FAIL", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600" },
  unparsed: {
    label: "verdict unclear",
    cls: "border-border bg-muted text-muted-foreground",
  },
} as const;

/** The critic's PASS/FAIL, stamped in like a rubber stamp (the run's emotional peak). */
export function VerdictBadge({
  verdict,
  small,
}: {
  verdict: "pass" | "fail" | "unparsed";
  small?: boolean;
}) {
  const reduce = useReducedMotion();
  const m = META[verdict];
  const stamp = verdict !== "unparsed" && !reduce;
  return (
    <motion.span
      initial={stamp ? { scale: 1.6, opacity: 0, rotate: -8 } : false}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={cn(
        "inline-block shrink-0 rounded border font-medium",
        small ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]",
        m.cls,
      )}
    >
      {m.label}
    </motion.span>
  );
}
