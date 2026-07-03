/**
 * Hosted answer proxy for the financial-dashboard console. A near-copy of
 * /api/ask (same Ollama-Cloud OpenAI-compatible streaming + guard + `ASK_*`
 * env), but grounded in a LIVE dashboard snapshot instead of the Alek profile.
 * The working /api/ask route is intentionally left untouched.
 */

import { MAX_INPUT_CHARS, type ChatMessage } from "@/lib/console/config";
import { buildDashboardSystemPrompt } from "@/lib/console/dashboard-context";
import { getAvailableModels } from "@/lib/console/model-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_OUTPUT_TOKENS = 800;
const MAX_MESSAGES = 12;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function originAllowed(req: Request): boolean {
  const allowed = process.env.ASK_ALLOWED_ORIGIN;
  if (!allowed) return true;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === allowed;
}

export async function POST(req: Request) {
  const baseUrl = process.env.ASK_BASE_URL;
  const defaultModel = process.env.ASK_MODEL;
  const apiKey = process.env.ASK_API_KEY;

  if (!baseUrl || !defaultModel || !apiKey) {
    return fail("Hosted answering is not configured.", 503);
  }
  if (!originAllowed(req)) {
    return fail("Forbidden.", 403);
  }

  let body: { messages?: ChatMessage[]; model?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail("`messages` must be a non-empty array.", 400);
  }
  if (messages.length > MAX_MESSAGES) {
    return fail("Too many messages.", 400);
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string") {
    return fail("Last message must be a user message.", 400);
  }
  if (last.content.length > MAX_INPUT_CHARS) {
    return fail(`Question too long (max ${MAX_INPUT_CHARS} chars).`, 400);
  }

  let model = defaultModel;
  const requested = body.model;
  if (typeof requested === "string" && requested !== defaultModel) {
    const available = await getAvailableModels();
    if (available.includes(requested)) {
      model = requested;
    }
  }

  const systemPrompt = await buildDashboardSystemPrompt();

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
        temperature: 0.3,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });
  } catch {
    return fail("The hosted model is unreachable right now.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    return fail("The hosted model is unavailable right now.", 502);
  }

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
