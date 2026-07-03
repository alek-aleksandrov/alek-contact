import type { NodeId, NodeState } from "@/lib/agents/config";

/** Which pipeline stage is currently "hot". Exactly one at a time. */
export type Stage = "fanout" | "critic" | "synth";

export type NodeVariant = "active" | "idle" | "done" | "error";

const isActive = (n?: NodeState) =>
  n?.status === "running" || n?.status === "streaming";
const isSettled = (n?: NodeState) => n?.status === "done" || n?.status === "error";

/**
 * Derive the spotlit stage purely from live node statuses (never a timer) — so
 * if the critic errors, `synth` stays idle, the stage never advances, and the
 * spotlight simply freezes on the critic's error. Abort behaves the same way.
 */
export function activeStage(nodes: Record<NodeId, NodeState>): Stage {
  if (isActive(nodes.synth) || isSettled(nodes.synth)) return "synth";
  if (isActive(nodes.critic) || isSettled(nodes.critic)) return "critic";
  return "fanout";
}

export function nodeVariant(node?: NodeState): NodeVariant {
  if (!node) return "idle";
  if (node.status === "error") return "error";
  if (node.status === "done") return "done";
  if (node.status === "running" || node.status === "streaming") return "active";
  return "idle";
}
