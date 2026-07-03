"use client";

import { Markdown } from "@/components/console/markdown";
import type { NodeState } from "@/lib/agents/config";

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

const VERDICT_META = {
  pass: { label: "PASS", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" },
  fail: { label: "FAIL", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600" },
  unparsed: { label: "verdict unclear", cls: "border-border bg-muted text-muted-foreground" },
} as const;

export function AgentNode({ node }: { node: NodeState }) {
  const meta = STATUS_META[node.status];
  const isSynth = node.role === "synthesizer";
  const hasBody = node.text.trim().length > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-medium">{node.label}</span>
          {node.verdict ? (
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${VERDICT_META[node.verdict].cls}`}
            >
              {VERDICT_META[node.verdict].label}
            </span>
          ) : null}
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
