"use client";

import { useState } from "react";
import type { JobCitation } from "@repo/shared";
import { JobAskStreamParser } from "@/lib/jobs/stream";
import { SUGGESTED_MARKET_QUESTIONS } from "@/lib/jobs/config";
import { SourcesPanel } from "./sources-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketFitConsole({
  chips = SUGGESTED_MARKET_QUESTIONS,
}: {
  chips?: string[];
} = {}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<JobCitation[]>([]);
  const [busy, setBusy] = useState(false);

  const [gatherBusy, setGatherBusy] = useState(false);
  const [gatherLog, setGatherLog] = useState("");

  async function ask() {
    if (!question.trim() || busy) return;
    setBusy(true);
    setAnswer("");
    setCitations([]);
    try {
      const res = await fetch("/api/ask-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) throw new Error("unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parser = new JobAskStreamParser();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const delta = parser.feed(decoder.decode(value, { stream: true }));
        if (parser.meta) setCitations(parser.meta.citations ?? []);
        if (delta) setAnswer((a) => a + delta);
      }
    } catch {
      setAnswer("Retrieval is unavailable right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function gather() {
    if (gatherBusy) return;
    setGatherBusy(true);
    setGatherLog("");
    try {
      const res = await fetch("/api/jobs/refresh", { method: "POST" });
      if (!res.ok || !res.body) {
        setGatherLog(await res.text().catch(() => "Gather failed"));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setGatherLog((log) => log + decoder.decode(value, { stream: true }));
      }
    } catch {
      setGatherLog("Gather is unavailable right now. Try again in a moment.");
    } finally {
      setGatherBusy(false);
    }
  }

  return (
    <div>
      {chips.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={busy}
              onClick={() => setQuestion(chip)}
              className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do senior React roles ask for?"
          maxLength={500}
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className={cn(buttonVariants({ size: "lg" }), "px-4")}
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
      {busy && !answer ? (
        <p className="mt-5 text-sm text-muted-foreground">retrieving…</p>
      ) : null}
      {answer ? (
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
          {busy ? (
            <span className="animate-pulse text-muted-foreground">▍</span>
          ) : null}
        </p>
      ) : null}
      <SourcesPanel citations={citations} />

      <div className="mt-8 border-t border-border pt-4">
        <button
          type="button"
          disabled={gatherBusy}
          onClick={() => void gather()}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}
        >
          {gatherBusy ? "Gathering…" : "Gather latest"}
        </button>
        {gatherLog ? (
          <pre className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
            {gatherLog}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
