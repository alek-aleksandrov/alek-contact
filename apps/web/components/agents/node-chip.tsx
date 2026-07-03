"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { VerdictBadge } from "@/components/agents/verdict-badge";
import type { NodeVariant } from "@/components/agents/stage";
import type { NodeState } from "@/lib/agents/config";
import { cn } from "@/lib/utils";

const DOT: Record<NodeVariant, string> = {
  active: "bg-emerald-500 animate-pulse",
  done: "bg-emerald-500",
  error: "bg-red-500",
  idle: "bg-muted-foreground/40",
};

/**
 * A settled node collapsed to a compact chip. Completed work is never destroyed
 * — tap to expand the node's full text (honesty: collapse keeps work reachable).
 */
export function NodeChip({
  node,
  variant,
}: {
  node: NodeState;
  variant: NodeVariant;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const hasBody = node.text.trim().length > 0 || Boolean(node.error);

  return (
    <div className="rounded-lg border border-border/60 bg-card/40">
      <button
        type="button"
        onClick={() => hasBody && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
          hasBody && "cursor-pointer",
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", DOT[variant])} />
          <span className="truncate font-mono text-xs">{node.label}</span>
        </span>
        {node.verdict ? (
          <VerdictBadge verdict={node.verdict} small />
        ) : node.status === "error" ? (
          <span className="shrink-0 text-[10px] text-red-500">error</span>
        ) : hasBody ? (
          <span className="shrink-0 text-[10px] text-muted-foreground/60">
            {open ? "−" : "+"}
          </span>
        ) : null}
      </button>
      <AnimatePresence initial={false}>
        {open && hasBody ? (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto border-t border-border/50 px-3 py-2 text-xs">
              {node.status === "error" ? (
                <p className="text-red-500/90">{node.error}</p>
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {node.text}
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
