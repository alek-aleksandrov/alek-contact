import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumb } from "@/components/breadcrumb";
import { MultiAgentRunner } from "@/components/agents/multi-agent-runner";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Multi-Agent Visualizer",
  description:
    "Watch a research → critique → synthesize agent pipeline run live: three researchers fan out, a critic checks their work, and a synthesizer merges the answer.",
};

export default function MultiAgentPage() {
  return (
    <Section>
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: "Multi-Agent Visualizer" },
        ]}
      />
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Multi-Agent
      </p>
      <h1 className="font-heading mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Watch a multi-agent pipeline think.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        Ask a question worth debating. Three researcher agents fan out in parallel
        (optimist, skeptic, pragmatist), an adversarial critic checks their work and
        returns a verdict, and a synthesizer merges it into a final answer. It&apos;s
        all live: LLM calls on a free model, so your click spends my tokens. Keep it
        to a question or two.
      </p>

      <MultiAgentRunner />

      <div className="mt-16 border-t border-border/60 pt-10">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          How it works
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 p-5">
            <p className="font-heading text-sm font-medium">1 · Fan-out</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Three researchers run in parallel, each locked to a different lens, so
              you get genuinely diverse takes instead of one averaged answer.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-5">
            <p className="font-heading text-sm font-medium">
              2 · Adversarial critique
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A critic agent hunts for weak claims and contradictions, then returns a
              PASS/FAIL verdict on whether the research is sound enough to trust.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-5">
            <p className="font-heading text-sm font-medium">3 · Synthesis</p>
            <p className="mt-2 text-sm text-muted-foreground">
              A synthesizer folds the notes and the critique into one balanced,
              decisive answer. It&apos;s the orchestration pattern I build every day.
            </p>
          </div>
        </div>
        <Link
          href="/projects/multi-agent-visualizer"
          className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          how it&apos;s built
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Section>
  );
}
