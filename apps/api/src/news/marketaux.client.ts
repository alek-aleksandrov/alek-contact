import { Injectable } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

const BASE = "https://api.marketaux.com/v1/news/all";

type MarketauxArticle = {
  title: string;
  description: string | null;
  snippet: string | null;
  url: string;
  published_at: string;
  source: string;
};

type MarketauxResponse = { data?: MarketauxArticle[] };

/**
 * Marketaux news client — used for keyword search only. Two important free-tier
 * facts drive the query params:
 *   - `limit` is capped at 3 articles per request.
 *   - default sort is by relevance, which surfaces stale articles; we force
 *     `sort=published_at` so results are the freshest matches, not the most
 *     keyword-dense (which returned year-old stories in testing).
 * General market headlines are served by Finnhub instead — Marketaux's
 * unfiltered firehose is too noisy and too capped for a headline list.
 */
@Injectable()
export class MarketauxClient {
  private key(): string {
    const k = process.env.MARKETAUX_KEY;
    if (!k) throw new Error("MARKETAUX_KEY is not set");
    return k;
  }

  async search(query: string, limit = 3): Promise<NewsArticle[]> {
    const params = new URLSearchParams({
      search: query,
      language: "en",
      filter_entities: "true",
      sort: "published_at",
      limit: String(limit),
      api_token: this.key(),
    });
    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`Marketaux request failed: ${res.status}`);
    const json = (await res.json()) as MarketauxResponse;
    return (json.data ?? []).map((a) => ({
      title: a.title,
      source: a.source ?? "",
      url: a.url,
      publishedAt: a.published_at,
      summary: a.description ?? a.snippet ?? null,
    }));
  }
}
