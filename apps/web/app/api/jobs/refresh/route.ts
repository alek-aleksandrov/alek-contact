/**
 * Streaming proxy for the "Market Fit" corpus refresh action.
 *
 * Mirrors `apps/web/app/api/ask-jobs/route.ts`'s conventions: forwards the
 * POST to the Nest API's `/api/jobs/refresh` endpoint and streams that
 * response body straight back to the browser, unchanged. The Nest side
 * emits progress lines while ingest runs, and returns 409 (already
 * running) / 429 (cooldown) when the refresh is guarded off.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/jobs/refresh`, { method: "POST" });
  } catch {
    return new Response("Gather unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text().catch(() => "Gather failed"), {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
