import { Injectable, Logger } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

import { MarketauxClient } from "./marketaux.client";

type Cached = { data: NewsArticle[]; at: number };

/**
 * Market-news lookups for the finance surface, served by Marketaux (diverse
 * sources + per-article sentiment). Results are cached 6h keyed by the
 * normalized query — the public /mcp/finance endpoint could otherwise burn the
 * 100 req/day free quota, and market news doesn't move fast enough to need
 * fresher. On a refresh error we fall back to the last good (even expired)
 * value so a transient API hiccup never blanks the widget.
 */
@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly cache = new Map<string, Cached>();
  private readonly TTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor(private readonly marketaux: MarketauxClient) {}

  private async cached(
    key: string,
    fetcher: () => Promise<NewsArticle[]>,
  ): Promise<NewsArticle[]> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.TTL) return hit.data;
    try {
      const data = await fetcher();
      this.cache.set(key, { data, at: Date.now() });
      return data;
    } catch (err) {
      if (hit) {
        this.logger.warn(
          `News refresh failed for "${key}" — serving stale cache: ${String(err)}`,
        );
        return hit.data;
      }
      throw err;
    }
  }

  search(queryRaw: string): Promise<NewsArticle[]> {
    const query = queryRaw.trim().slice(0, 100);
    return this.cached(`q:${query.toLowerCase()}`, () =>
      this.marketaux.search(query),
    );
  }

  market(): Promise<NewsArticle[]> {
    return this.cached("market", () => this.marketaux.market());
  }
}
