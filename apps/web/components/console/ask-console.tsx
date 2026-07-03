"use client";

import { useEffect, useRef, useState } from "react";

import {
  MAX_INPUT_CHARS,
  SUGGESTED_QUESTIONS,
  type ChatMessage,
} from "@/lib/console/config";
import { askHosted } from "@/lib/console/hosted-engine";

type Mode = "hosted" | "offline";

const BOOT_LOG = [
  "booting ask-about-alek…",
  "✓ ready — ask me anything about Alek as a candidate",
];

export function AskConsole() {
  const [mode, setMode] = useState<Mode>("hosted");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the transcript pinned to the bottom as it grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function run(question: string) {
    const q = question.trim();
    if (!q || busy || q.length > MAX_INPUT_CHARS) return;

    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      await askHosted(history, (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          next[i] = { role: "assistant", content: next[i].content + delta };
          return next;
        });
      });
      setMode("hosted");
    } catch {
      setMode("offline");
      setMessages((prev) => {
        const next = [...prev];
        const i = next.length - 1;
        next[i] = {
          role: "assistant",
          content:
            "⚠ the model's taking a nap. Give it a moment and try again, or connect via MCP below.",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  const pill = mode === "offline" ? "● offline" : "● hosted";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0b0e14] font-mono text-sm text-zinc-200 shadow-sm">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-yellow-400/70" />
          <span className="size-2 rounded-full bg-green-400/70" />
          <span className="ml-2">ask-about-alek</span>
        </span>
        <span
          className={mode === "offline" ? "text-red-400/80" : "text-emerald-400/80"}
        >
          {pill}
        </span>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto px-4 py-3 leading-relaxed"
      >
        {BOOT_LOG.map((line, i) => (
          <p key={`boot-${i}`} className="text-zinc-500">
            {line}
          </p>
        ))}
        {messages.map((m, i) => (
          <div key={i} className="mt-2">
            {m.role === "user" ? (
              <p className="text-zinc-300">
                <span className="text-emerald-400">alek@portfolio:~$</span>{" "}
                {m.content}
              </p>
            ) : (
              <p className="whitespace-pre-wrap text-zinc-100">
                {m.content}
                {busy && i === messages.length - 1 && (
                  <span className="ml-0.5 inline-block animate-pulse">▍</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={busy}
            onClick={() => run(q)}
            className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
        className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5"
      >
        <span className="text-emerald-400">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_INPUT_CHARS}
          disabled={busy}
          placeholder="ask about Alek…"
          aria-label="Ask a question about Alek"
          className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="text-xs text-emerald-400 disabled:opacity-40"
        >
          {busy ? "…" : "run ⏎"}
        </button>
      </form>
    </div>
  );
}
