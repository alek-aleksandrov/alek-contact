"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";

import { AgentNode } from "@/components/agents/agent-node";
import { NodeChip } from "@/components/agents/node-chip";
import { activeStage, nodeVariant, type Stage } from "@/components/agents/stage";
import { RESEARCHER_ANGLES, type NodeId, type NodeState } from "@/lib/agents/config";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const T = { duration: 0.4, ease: EASE };

const FAN: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
const FAN_ITEM: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: T },
};

type Nodes = Record<NodeId, NodeState>;

function researchersOf(nodes: Nodes): NodeState[] {
  return RESEARCHER_ANGLES.map((a) => nodes[a.id]).filter(Boolean) as NodeState[];
}

/** fan-out · critique · synthesis stepper. */
function StageRail({ stage }: { stage: Stage }) {
  const steps: Array<{ id: Stage; label: string }> = [
    { id: "fanout", label: "fan-out" },
    { id: "critic", label: "critique" },
    { id: "synth", label: "synthesis" },
  ];
  const idx = steps.findIndex((s) => s.id === stage);
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full transition-colors",
              i < idx
                ? "bg-emerald-500"
                : i === idx
                  ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                  : "bg-muted-foreground/30",
            )}
          />
          <span className={i === idx ? "text-foreground" : ""}>{s.label}</span>
          {i < steps.length - 1 ? (
            <span className="h-px w-6 bg-border" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Synthesizer card that settles into a "Final answer" frame on done. */
function SynthCard({ node }: { node: NodeState }) {
  const done = node.status === "done";
  return (
    <div
      className={cn(
        "rounded-xl transition-all",
        done && "border border-emerald-500/30 bg-emerald-500/5 p-4",
      )}
    >
      {done ? (
        <p className="mb-3 font-mono text-[11px] tracking-widest text-emerald-600 uppercase">
          Final answer
        </p>
      ) : null}
      <AgentNode node={node} />
    </div>
  );
}

/** Desktop (≥sm): the hot stage is centered/enlarged; settled stages dock left. */
function DesktopSpotlight({ nodes, stage }: { nodes: Nodes; stage: Stage }) {
  const researchers = researchersOf(nodes);
  const showResearchersDocked = stage !== "fanout";
  const showCriticDocked = stage === "synth";
  const hasDock = showResearchersDocked || showCriticDocked;

  return (
    <div>
      <StageRail stage={stage} />
      <LayoutGroup>
        <div className="mt-6 flex items-start gap-4">
          {hasDock ? (
            <motion.div layout className="flex w-44 shrink-0 flex-col gap-2">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase">
                Done
              </p>
              {showResearchersDocked
                ? researchers.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={T}
                    >
                      <NodeChip node={n} variant={nodeVariant(n)} />
                    </motion.div>
                  ))
                : null}
              {showCriticDocked && nodes.critic ? (
                <motion.div
                  key="critic-chip"
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={T}
                >
                  <NodeChip node={nodes.critic} variant={nodeVariant(nodes.critic)} />
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}

          <motion.div layout className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {stage === "fanout" ? (
                <motion.div
                  key="fanout"
                  variants={FAN}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {researchers.map((n) => (
                    <motion.div key={n.id} variants={FAN_ITEM}>
                      <AgentNode node={n} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : stage === "critic" && nodes.critic ? (
                <motion.div
                  key="critic"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={T}
                >
                  <AgentNode node={nodes.critic} />
                </motion.div>
              ) : nodes.synth ? (
                <motion.div
                  key="synth"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={T}
                >
                  <SynthCard node={nodes.synth} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </LayoutGroup>
    </div>
  );
}

function Ghost({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/50 px-4 py-3 text-xs text-muted-foreground/50">
      {label}
    </div>
  );
}

function TimelineRow({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative border-l-2 border-border/60 pl-4">
      <span
        className={cn(
          "absolute -left-[5px] top-1 size-2 rounded-full",
          active ? "bg-emerald-400" : "bg-muted-foreground/30",
        )}
      />
      <p
        className={cn(
          "mb-2 font-mono text-[10px] tracking-widest uppercase",
          active ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/** Mobile (<sm): vertical spotlight timeline — hot stage expanded, settled collapsed. */
function VerticalTimeline({ nodes, stage }: { nodes: Nodes; stage: Stage }) {
  const researchers = researchersOf(nodes);
  return (
    <div className="space-y-4">
      <TimelineRow label="Fan-out" active={stage === "fanout"}>
        {stage === "fanout" ? (
          <div className="space-y-3">
            {researchers.map((n) => (
              <AgentNode key={n.id} node={n} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {researchers.map((n) => (
              <NodeChip key={n.id} node={n} variant={nodeVariant(n)} />
            ))}
          </div>
        )}
      </TimelineRow>

      <TimelineRow label="Critique" active={stage === "critic"}>
        {stage === "critic" && nodes.critic ? (
          <AgentNode node={nodes.critic} />
        ) : stage === "synth" && nodes.critic ? (
          <NodeChip node={nodes.critic} variant={nodeVariant(nodes.critic)} />
        ) : (
          <Ghost label="waiting…" />
        )}
      </TimelineRow>

      <TimelineRow label="Synthesis" active={stage === "synth"}>
        {stage === "synth" && nodes.synth ? (
          <SynthCard node={nodes.synth} />
        ) : (
          <Ghost label="waiting…" />
        )}
      </TimelineRow>
    </div>
  );
}

/** Reduced-motion: every stage visible, stacked, no reflow (Direction A static). */
function StaticStacked({ nodes }: { nodes: Nodes }) {
  const researchers = researchersOf(nodes);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {researchers.map((n) => (
          <AgentNode key={n.id} node={n} />
        ))}
      </div>
      {nodes.critic ? <AgentNode node={nodes.critic} /> : null}
      {nodes.synth ? <SynthCard node={nodes.synth} /> : null}
    </div>
  );
}

export function PipelineGraph({ nodes }: { nodes: Nodes }) {
  const reduce = useReducedMotion();
  const stage = activeStage(nodes);

  if (reduce) return <StaticStacked nodes={nodes} />;

  return (
    <>
      <div className="hidden sm:block">
        <DesktopSpotlight nodes={nodes} stage={stage} />
      </div>
      <div className="sm:hidden">
        <VerticalTimeline nodes={nodes} stage={stage} />
      </div>
    </>
  );
}
