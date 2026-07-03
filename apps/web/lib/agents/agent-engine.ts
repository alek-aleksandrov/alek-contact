"use client";

import type { AgentCallRequest } from "@/lib/agents/config";

export class AgentError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AgentError";
    this.status = status;
  }
}

/**
 * POST one agent call to /api/agent and stream plain-text deltas.
 * Abortable via `signal`. Throws AgentError on non-OK (status carried for 429).
 */
export async function runAgent(
  req: AgentCallRequest,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = `Agent request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* non-JSON */
    }
    throw new AgentError(msg, res.status);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onDelta(chunk);
    }
  }
  return full;
}
