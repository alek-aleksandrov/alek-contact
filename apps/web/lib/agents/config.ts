/** Shared multi-agent config — pure constants/types, safe on client and server. */

export type RoleId = "researcher" | "critic" | "synthesizer";

/** Node ids in the fixed pipeline DAG. Researchers are r0..r{N-1}. */
export type NodeId = string; // "r0" | "r1" | "r2" | "critic" | "synth"

export type NodeStatus = "idle" | "running" | "streaming" | "done" | "error";

export type NodeState = {
  id: NodeId;
  role: RoleId;
  label: string;
  status: NodeStatus;
  /** Accumulated streamed text for this node. */
  text: string;
  /** Critic only: parsed verdict once available. */
  verdict?: "pass" | "fail" | "unparsed";
  error?: string;
};

/** Wire payload the client sends to /api/agent. No system prompt — role id only. */
export type AgentCallRequest = {
  role: RoleId;
  /** The visitor's question/topic (bounded by MAX_INPUT_CHARS). */
  topic: string;
  /** Researcher angle label (researcher role only). */
  angle?: string;
  /** Combined prior-stage text (critic/synthesizer roles). */
  priorOutputs?: string;
  /** Critic's verdict+notes, for the synthesizer only. */
  critique?: string;
};

/** Distinct lenses so the 3 parallel researchers produce genuinely diverse takes. */
export const RESEARCHER_ANGLES = [
  { id: "r0", label: "Optimist", lens: "the strongest case FOR, upside and opportunities" },
  { id: "r1", label: "Skeptic", lens: "the strongest case AGAINST, risks and failure modes" },
  { id: "r2", label: "Pragmatist", lens: "practical trade-offs, costs, and what it takes to execute" },
] as const;

export const RESEARCHER_COUNT = RESEARCHER_ANGLES.length; // 3

/** Hard cap on the visitor's topic (chars). Bounds cost + abuse. Mirrors console. */
export const MAX_INPUT_CHARS = 400;

/** Per-call output cap. Small — keep runs cheap and snappy. Server re-enforces this. */
export const MAX_OUTPUT_TOKENS = 256;

/** Seed topics as clickable chips. */
export const SUGGESTED_TOPICS = [
  "Should a small startup build on a monorepo?",
  "Is server-side rendering worth the complexity in 2026?",
  "Should teams adopt multi-agent LLM pipelines?",
  "Is TypeScript worth it for a solo side project?",
];
