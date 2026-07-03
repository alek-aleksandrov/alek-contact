/**
 * Server-only role registry for the multi-agent visualizer.
 *
 * The /api/agent proxy owns every system prompt here. The client only ever
 * sends a RoleId + topic + prior-stage text — never a system prompt — so the
 * proxy cannot be repurposed as an open LLM. NEVER import this from client code.
 */

import type { AgentCallRequest, RoleId } from "@/lib/agents/config";

const RESEARCHER_SYSTEM = (lens: string) =>
  [
    "You are a Researcher agent in a multi-agent pipeline.",
    `Analyze the user's question through ONE lens: ${lens}.`,
    "Give 3-5 tight, concrete bullet points. No preamble, no conclusion, no restating the question.",
    "Stay strictly on your assigned lens. Be specific; avoid hedging filler.",
  ].join("\n");

const CRITIC_SYSTEM = [
  "You are an adversarial Critic agent. You receive several researchers' notes on a question.",
  "Find weaknesses: unsupported claims, contradictions, missing considerations, overstatement.",
  "Then judge whether the combined research is sound enough to synthesize a trustworthy answer.",
  "OUTPUT FORMAT — this is mandatory:",
  "Line 1 must be exactly `VERDICT: PASS` or `VERDICT: FAIL`.",
  "Then 2-4 bullet points explaining the verdict. Nothing before line 1.",
].join("\n");

const SYNTH_SYSTEM = [
  "You are a Synthesizer agent. You receive multiple researchers' notes and a critic's verdict.",
  "Produce the FINAL answer to the user's question: balanced, decisive, and readable.",
  "Fold in the critic's concerns; do not paper over disagreements. 1-2 short paragraphs.",
  "Do not mention the pipeline, the agents, or the critique process — just answer.",
].join("\n");

export function buildRolePrompt(
  role: RoleId,
  req: AgentCallRequest,
): { system: string; user: string } {
  switch (role) {
    case "researcher":
      return {
        system: RESEARCHER_SYSTEM(req.angle ?? "a balanced overview"),
        user: `Question: ${req.topic}`,
      };
    case "critic":
      return {
        system: CRITIC_SYSTEM,
        user: `Question: ${req.topic}\n\nResearchers' notes:\n${req.priorOutputs ?? ""}`,
      };
    case "synthesizer":
      return {
        system: SYNTH_SYSTEM,
        user:
          `Question: ${req.topic}\n\nResearchers' notes:\n${req.priorOutputs ?? ""}` +
          `\n\nCritic's verdict:\n${req.critique ?? ""}`,
      };
  }
}
