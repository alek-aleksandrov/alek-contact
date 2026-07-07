/**
 * Thin streaming proxy for the "Market Fit" RAG job-market Q&A feature.
 *
 * Unlike /api/ask and /api/ask-finance, this route does NOT call an LLM
 * directly — it forwards `{ question }` to the Nest API's
 * `/api/jobs/ask` endpoint and streams that response body straight back to
 * the browser, unchanged. The Nest side emits a JSON metadata frame line
 * followed by answer tokens; the web client is responsible for parsing
 * that shape. No `ASK_*` env vars are used here since generation happens
 * entirely in Nest.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let question = "";
  try {
    const body = (await req.json()) as { question?: string };
    question = body.question ?? "";
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/jobs/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch {
    return new Response("Retrieval unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Retrieval unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
