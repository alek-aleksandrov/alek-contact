"use client";

import {
  RESEARCHER_ANGLES,
  type NodeId,
  type NodeStatus,
} from "@/lib/agents/config";
import { AgentError, runAgent } from "@/lib/agents/agent-engine";

export type PipelineHandlers = {
  onDelta: (nodeId: NodeId, delta: string) => void;
  onStatus: (
    nodeId: NodeId,
    status: NodeStatus,
    extra?: { verdict?: "pass" | "fail" | "unparsed"; error?: string },
  ) => void;
  onDone: (final: string | null) => void;
  onRunError: (message: string) => void;
};

/** Parse the critic's mandated `VERDICT: PASS|FAIL` first line; fall back to unparsed. */
function parseVerdict(text: string): "pass" | "fail" | "unparsed" {
  const m = text.match(/VERDICT:\s*(PASS|FAIL)/i);
  if (!m) return "unparsed";
  return m[1].toUpperCase() === "PASS" ? "pass" : "fail";
}

function quotaAware(err: unknown, fallback: string): string {
  if (err instanceof AgentError && err.status === 429) {
    return "The free-tier model is rate-limited right now. Give it a minute and re-run.";
  }
  return fallback;
}

/** True when a thrown error is just the user aborting — must be handled silently. */
function isAbort(err: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (err as { name?: string })?.name === "AbortError";
}

export async function runPipeline(
  topic: string,
  h: PipelineHandlers,
  signal: AbortSignal,
): Promise<void> {
  // 1) Fan out researchers in parallel. Each buffers its own text locally.
  const researcherResults = await Promise.all(
    RESEARCHER_ANGLES.map(async (angle) => {
      const id = angle.id;
      h.onStatus(id, "running");
      let buf = "";
      try {
        buf = await runAgent(
          { role: "researcher", topic, angle: angle.lens },
          (d) => {
            h.onStatus(id, "streaming");
            h.onDelta(id, d);
          },
          signal,
        );
        h.onStatus(id, "done");
        return { label: angle.label, text: buf, ok: true };
      } catch (err) {
        if (isAbort(err, signal)) return { label: angle.label, text: "", ok: false };
        h.onStatus(id, "error", { error: quotaAware(err, "Researcher failed.") });
        return { label: angle.label, text: "", ok: false };
      }
    }),
  );

  if (signal.aborted) return; // user hit Stop during fan-out — bail silently

  const survivors = researcherResults.filter((r) => r.ok && r.text.trim());
  if (survivors.length === 0) {
    h.onRunError("All researchers failed — likely a rate limit. Try again shortly.");
    return;
  }
  const combined = survivors
    .map((r) => `## ${r.label}\n${r.text}`)
    .join("\n\n");

  if (signal.aborted) return;

  // 2) Critic on combined notes.
  h.onStatus("critic", "running");
  let critiqueText = "";
  try {
    critiqueText = await runAgent(
      { role: "critic", topic, priorOutputs: combined },
      (d) => {
        h.onStatus("critic", "streaming");
        h.onDelta("critic", d);
      },
      signal,
    );
    h.onStatus("critic", "done", { verdict: parseVerdict(critiqueText) });
  } catch (err) {
    if (isAbort(err, signal)) return;
    h.onStatus("critic", "error", { error: quotaAware(err, "Critic failed.") });
    h.onRunError(quotaAware(err, "The critic step failed."));
    return;
  }

  if (signal.aborted) return;

  // 3) Synthesizer on notes + critique.
  h.onStatus("synth", "running");
  try {
    const final = await runAgent(
      { role: "synthesizer", topic, priorOutputs: combined, critique: critiqueText },
      (d) => {
        h.onStatus("synth", "streaming");
        h.onDelta("synth", d);
      },
      signal,
    );
    h.onStatus("synth", "done");
    h.onDone(final);
  } catch (err) {
    if (isAbort(err, signal)) return;
    h.onStatus("synth", "error", { error: quotaAware(err, "Synthesizer failed.") });
    h.onRunError(quotaAware(err, "The synthesis step failed."));
  }
}
