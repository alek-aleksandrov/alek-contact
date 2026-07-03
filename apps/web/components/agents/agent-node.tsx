"use client";

import { Markdown } from "@/components/console/markdown";
import { VerdictBadge } from "@/components/agents/verdict-badge";
import type { NodeState } from "@/lib/agents/config";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  NodeState["status"],
  { label: string; cls: string; dot: string }
> = {
  idle: { label: "idle", cls: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  running: { label: "thinking…", cls: "text-amber-500", dot: "bg-amber-500 animate-pulse" },
  streaming: { label: "writing…", cls: "text-emerald-500", dot: "bg-emerald-500 animate-pulse" },
  done: { label: "done", cls: "text-emerald-600", dot: "bg-emerald-500" },
  error: { label: "error", cls: "text-red-500", dot: "bg-red-500" },
};

/** Full "spotlight" node card. Body text scrolls inside a fixed-height box so a
 * `layout`-animated parent never re-animates on every streamed token (Rule B). */
export function AgentNode({ node }: { node: NodeState }) {
  const meta = STATUS_META[node.status];
  const isSynth = node.role === "synthesizer";
  const hasBody = node.text.trim().length > 0;
  const active = node.status === "running" || node.status === "streaming";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/40 p-4 transition-colors",
        active
          ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
          : node.status === "error"
            ? "border-red-500/40"
            : "border-border/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-medium">{node.label}</span>
          {node.verdict ? <VerdictBadge verdict={node.verdict} /> : null}
        </div>
        <span className={`flex items-center gap-1.5 text-xs ${meta.cls}`}>
          <span className={`size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 max-h-56 overflow-y-auto text-sm">
        {node.status === "error" ? (
          <p className="text-red-500/90">{node.error ?? "Something went wrong."}</p>
        ) : hasBody ? (
          isSynth ? (
            <Markdown>{node.text}</Markdown>
          ) : (
            <p className="whitespace-pre-wrap text-muted-foreground">{node.text}</p>
          )
        ) : (
          <p className="text-muted-foreground/50 italic">
            {node.status === "idle" ? "waiting…" : "…"}
          </p>
        )}
      </div>
    </div>
  );
}
