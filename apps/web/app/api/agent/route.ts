/**
 * Generic role-based LLM proxy for the multi-agent visualizer.
 *
 * Mirrors /api/ask's Ollama-Cloud + SSE->text streaming, but with NO Alek
 * grounding. The client sends a RoleId (not a system prompt); this route injects
 * the server-owned role prompt and pins the model to ASK_MODEL so the proxy can
 * never be driven as an open general-purpose LLM. See lib/agents/roles.ts.
 */

import {
  MAX_INPUT_CHARS,
  MAX_OUTPUT_TOKENS,
  type AgentCallRequest,
  type RoleId,
} from "@/lib/agents/config";
import { buildRolePrompt } from "@/lib/agents/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_ROLES: RoleId[] = ["researcher", "critic", "synthesizer"];

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Best-effort same-origin guard. Missing Origin (same-origin) is allowed. */
function originAllowed(req: Request): boolean {
  const allowed = process.env.ASK_ALLOWED_ORIGIN;
  if (!allowed) return true; // not configured -> skip
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin requests often omit Origin
  return origin === allowed;
}

export async function POST(req: Request) {
  const baseUrl = process.env.ASK_BASE_URL;
  const model = process.env.ASK_MODEL; // server-pinned; never client-choosable
  const apiKey = process.env.ASK_API_KEY;

  if (!baseUrl || !model || !apiKey) {
    return fail("Agent backend is not configured.", 503);
  }
  if (!originAllowed(req)) {
    return fail("Forbidden.", 403);
  }

  let body: Partial<AgentCallRequest>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", 400);
  }

  const role = body.role;
  if (typeof role !== "string" || !VALID_ROLES.includes(role as RoleId)) {
    return fail("`role` must be researcher | critic | synthesizer.", 400);
  }
  const topic = body.topic;
  if (typeof topic !== "string" || topic.trim().length === 0) {
    return fail("`topic` is required.", 400);
  }
  if (topic.length > MAX_INPUT_CHARS) {
    return fail(`Topic too long (max ${MAX_INPUT_CHARS} chars).`, 400);
  }

  const { system, user } = buildRolePrompt(role as RoleId, {
    role: role as RoleId,
    topic,
    angle: typeof body.angle === "string" ? body.angle : undefined,
    priorOutputs:
      typeof body.priorOutputs === "string" ? body.priorOutputs : undefined,
    critique: typeof body.critique === "string" ? body.critique : undefined,
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: role === "researcher" ? 0.7 : 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return fail("The model is unreachable right now.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    // Surface 429 distinctly so the client can show a quota message.
    const status = upstream.status === 429 ? 429 : 502;
    return fail(
      status === 429
        ? "Rate limited by the free-tier model. Try again shortly."
        : "The model is unavailable right now.",
      status,
    );
  }

  // Transform upstream OpenAI-style SSE into a plain-text delta stream.
  // (Duplicated verbatim from /api/ask — proven; do not refactor into a shared helper.)
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore keep-alive / non-JSON lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
