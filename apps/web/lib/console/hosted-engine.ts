"use client";

import type { ChatMessage } from "@/lib/console/config";

/**
 * Hosted engine: POST the conversation to /api/ask and stream plain-text
 * deltas. Throws on a non-OK response so the console can fall to "offline".
 */
export async function askHosted(
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
): Promise<string> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Hosted request failed (${res.status})`);
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
