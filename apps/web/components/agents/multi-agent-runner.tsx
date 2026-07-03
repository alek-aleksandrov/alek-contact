"use client";

import { useEffect, useRef, useState } from "react";

import { PipelineGraph } from "@/components/agents/pipeline-graph";
import { Markdown } from "@/components/console/markdown";
import { buttonVariants } from "@/components/ui/button";
import {
  MAX_INPUT_CHARS,
  RESEARCHER_ANGLES,
  SUGGESTED_TOPICS,
  type NodeId,
  type NodeState,
  type NodeStatus,
} from "@/lib/agents/config";
import { runPipeline } from "@/lib/agents/pipeline";
import { cn } from "@/lib/utils";

function initialNodes(): Record<NodeId, NodeState> {
  const nodes: Record<NodeId, NodeState> = {};
  for (const a of RESEARCHER_ANGLES) {
    nodes[a.id] = {
      id: a.id,
      role: "researcher",
      label: a.label,
      status: "idle",
      text: "",
    };
  }
  nodes.critic = { id: "critic", role: "critic", label: "Critic", status: "idle", text: "" };
  nodes.synth = {
    id: "synth",
    role: "synthesizer",
    label: "Synthesizer",
    status: "idle",
    text: "",
  };
  return nodes;
}

export function MultiAgentRunner() {
  const [topic, setTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [final, setFinal] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Record<NodeId, NodeState>>(initialNodes);

  const controllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight run when the user navigates away (quota hygiene).
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  function run(q: string) {
    const t = q.trim();
    if (!t || running || t.length > MAX_INPUT_CHARS) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setNodes(initialNodes());
    setBanner(null);
    setFinal(null);
    setRunning(true);

    // Functional updaters keyed by id — required so the 3 parallel researcher
    // streams don't clobber each other (see pipeline.ts concurrency contract).
    const onDelta = (id: NodeId, d: string) =>
      setNodes((p) => ({ ...p, [id]: { ...p[id], text: p[id].text + d } }));
    const onStatus = (
      id: NodeId,
      status: NodeStatus,
      extra?: { verdict?: "pass" | "fail" | "unparsed"; error?: string },
    ) => setNodes((p) => ({ ...p, [id]: { ...p[id], status, ...extra } }));

    runPipeline(
      t,
      {
        onDelta,
        onStatus,
        onDone: (f) => {
          setFinal(f);
          setRunning(false);
        },
        onRunError: (msg) => {
          setBanner(msg);
          setRunning(false);
        },
      },
      controller.signal,
    ).catch(() => {
      // The pipeline handles its own per-node errors; an AbortError here is expected.
      setRunning(false);
    });
  }

  function stop() {
    controllerRef.current?.abort();
    setRunning(false);
  }

  return (
    <div className="mt-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(topic);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={MAX_INPUT_CHARS}
          disabled={running}
          placeholder="Ask a question worth debating…"
          aria-label="Question for the agent pipeline"
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground/30 focus:outline-none disabled:opacity-50"
        />
        {running ? (
          <button
            type="button"
            onClick={stop}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!topic.trim()}
            className={cn(buttonVariants(), "disabled:opacity-40")}
          >
            Run
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_TOPICS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={running}
            onClick={() => {
              setTopic(q);
              run(q);
            }}
            className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {banner ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-600">
          {banner}
        </p>
      ) : null}

      <div className="mt-8">
        <PipelineGraph nodes={nodes} />
      </div>

      {final ? (
        <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="font-mono text-xs tracking-widest text-emerald-600 uppercase">
            Final answer
          </p>
          <div className="mt-3 text-sm text-foreground/90">
            <Markdown>{final}</Markdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}
