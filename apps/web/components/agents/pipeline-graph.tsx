"use client";

import { AgentNode } from "@/components/agents/agent-node";
import {
  RESEARCHER_ANGLES,
  type NodeId,
  type NodeState,
} from "@/lib/agents/config";

function isActive(n?: NodeState) {
  return n?.status === "running" || n?.status === "streaming";
}

/**
 * Fixed 3→1→1 DAG rendered as three CSS columns with an approximate SVG
 * connector overlay (percentage coords, no DOM measurement — fine for a fixed
 * layout). Connectors highlight when the downstream node is active. Overlay is
 * desktop-only; on mobile the columns stack with flow captions instead.
 */
export function PipelineGraph({ nodes }: { nodes: Record<NodeId, NodeState> }) {
  const criticActive = isActive(nodes.critic);
  const synthActive = isActive(nodes.synth);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
        aria-hidden
      >
        {[18, 50, 82].map((y) => (
          <line
            key={y}
            x1="33%"
            y1={`${y}%`}
            x2="50%"
            y2="50%"
            strokeWidth={1.5}
            className={criticActive ? "stroke-emerald-500/70" : "stroke-border"}
          />
        ))}
        <line
          x1="50%"
          y1="50%"
          x2="67%"
          y2="50%"
          strokeWidth={1.5}
          className={synthActive ? "stroke-emerald-500/70" : "stroke-border"}
        />
      </svg>

      <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:hidden">
            Researchers ↓
          </p>
          {RESEARCHER_ANGLES.map((a) =>
            nodes[a.id] ? <AgentNode key={a.id} node={nodes[a.id]} /> : null,
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:hidden">
            → Critic
          </p>
          {nodes.critic ? <AgentNode node={nodes.critic} /> : null}
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:hidden">
            → Synthesis
          </p>
          {nodes.synth ? <AgentNode node={nodes.synth} /> : null}
        </div>
      </div>
    </div>
  );
}
