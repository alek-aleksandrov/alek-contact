import { Injectable } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

const BASE = "https://finnhub.io/api/v1/news";

type FinnhubNews = {
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  datetime: number; // unix seconds
};

/**
 * Finnhub general-market-news client. Reuses the existing FINNHUB_API_KEY and
 * works in production on the free tier. Returns a clean, plentiful headline
 * stream — used for the market-news widget and console grounding, where
 * Marketaux's 3-article cap and noisy firehose fall short.
 */
@Injectable()
export class FinnhubNewsClient {
  private key(): string {
    const k = process.env.FINNHUB_API_KEY;
    if (!k) throw new Error("FINNHUB_API_KEY is not set");
    return k;
  }

  async general(limit = 8): Promise<NewsArticle[]> {
    const res = await fetch(`${BASE}?category=general&token=${this.key()}`);
    if (!res.ok) throw new Error(`Finnhub news failed: ${res.status}`);
    const json = (await res.json()) as FinnhubNews[];
    return json.slice(0, limit).map((a) => ({
      title: a.headline,
      source: a.source ?? "",
      url: a.url,
      publishedAt: new Date(a.datetime * 1000).toISOString(),
      summary: a.summary ?? null,
    }));
  }
}
