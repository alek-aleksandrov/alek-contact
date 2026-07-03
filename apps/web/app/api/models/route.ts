/**
 * Lists the model ids the hosted backend currently offers, so the console can
 * populate its model picker. Read-only; the fetch + cache live in the shared
 * server-only model registry. Returns the configured default alongside the
 * list so the client always has a sane preselection even if the list is empty.
 */

import { getAvailableModels } from "@/lib/console/model-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const defaultModel = process.env.ASK_MODEL;
  if (!process.env.ASK_BASE_URL || !process.env.ASK_API_KEY || !defaultModel) {
    return Response.json(
      { error: "Hosted answering is not configured." },
      { status: 503 },
    );
  }

  const models = await getAvailableModels();
  return Response.json(
    { models, default: defaultModel },
    { headers: { "Cache-Control": "no-store" } },
  );
}
