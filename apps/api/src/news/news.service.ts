import { Injectable } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

import { FinnhubNewsClient } from "./finnhub-news.client";
import { MarketauxClient } from "./marketaux.client";

type Cached = { data: NewsArticle[]; at: number };

/**
 * Market-news lookups for the finance surface. Hybrid provider split:
 *   - search(query) → Marketaux (fresh keyword search + sentiment-tagged
 *     entities), which has a 100 req/day free cap.
 *   - market()      → Finnhub general news (clean, plentiful headlines, no
 *     per-request cap), reusing the existing FINNHUB_API_KEY.
 * Both paths are cached 30 min (keyed by normalized query) so the public
 * /mcp/finance endpoint can't burn the Marketaux daily quota.
 */
@Injectable()
export class NewsService {
  private readonly cache = new Map<string, Cached>();
  private readonly TTL = 30 * 60 * 1000; // 30 min

  constructor(
    private readonly marketaux: MarketauxClient,
    private readonly finnhub: FinnhubNewsClient,
  ) {}

  private async cached(
    key: string,
    fetcher: () => Promise<NewsArticle[]>,
  ): Promise<NewsArticle[]> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.TTL) return hit.data;
    const data = await fetcher();
    this.cache.set(key, { data, at: Date.now() });
    return data;
  }

  search(queryRaw: string): Promise<NewsArticle[]> {
    const query = queryRaw.trim().slice(0, 100);
    return this.cached(`q:${query.toLowerCase()}`, () =>
      this.marketaux.search(query),
    );
  }

  market(): Promise<NewsArticle[]> {
    return this.cached("market", () => this.finnhub.general());
  }
}
