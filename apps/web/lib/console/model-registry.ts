/**
 * Server-only registry of models the configured hosted backend offers.
 *
 * Fetches the provider's OpenAI-compatible /models list and caches it with a
 * short TTL, so /api/models and /api/ask share one source of truth without
 * hammering the upstream. Never import this from client code — it reads the
 * server-only ASK_* env vars.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Models verified to answer on the backend's free tier (probed 2026-07-02).
 * The provider's /models lists everything it knows about — including paid models
 * that 502 on the free tier — so we intersect against this set. That keeps the
 * picker to models that actually work AND stops /api/ask from being pointed at a
 * paid model. Edit this list if the free tier's offerings change.
 */
const FREE_TIER_MODELS = new Set([
  "gpt-oss:120b",
  "gpt-oss:20b",
  "gemma3:4b",
  "gemma3:12b",
  "gemma3:27b",
  "gemma4:31b",
  "ministral-3:3b",
  "ministral-3:8b",
  "ministral-3:14b",
  "devstral-small-2:24b",
  "devstral-2:123b",
  "glm-4.7",
  "minimax-m2.1",
  "minimax-m2.5",
  "minimax-m3",
  "nemotron-3-nano:30b",
  "nemotron-3-super",
  "nemotron-3-ultra",
  "qwen3-coder-next",
  "qwen3-coder:480b",
]);

let cache: { models: string[]; at: number } | null = null;

/**
 * The model ids the backend currently offers. Returns the last good list (or
 * `[]`) if the backend is unconfigured or the request fails — it never throws,
 * so a flaky /models endpoint can't break answering. Callers fall back to the
 * configured default model when a requested id isn't in this list.
 */
export async function getAvailableModels(): Promise<string[]> {
  const baseUrl = process.env.ASK_BASE_URL;
  const apiKey = process.env.ASK_API_KEY;
  if (!baseUrl || !apiKey) return [];

  if (cache && Date.now() - cache.at < TTL_MS) return cache.models;

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return cache?.models ?? [];
    const json = (await res.json()) as { data?: Array<{ id?: unknown }> };
    const models = Array.isArray(json.data)
      ? json.data
          .map((m) => m.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
          .filter((id) => FREE_TIER_MODELS.has(id))
      : [];
    cache = { models, at: Date.now() };
    return models;
  } catch {
    return cache?.models ?? [];
  }
}
