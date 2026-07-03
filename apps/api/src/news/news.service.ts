import { Injectable } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

import { NewsApiClient, type RawArticle } from "./news.client";

type Cached = { data: NewsArticle[]; at: number };

/**
 * Market-news lookups for the finance MCP. NewsAPI's free tier is only ~100
 * requests/day, so every query is cached aggressively (30 min) keyed by the
 * normalized query — the public /finance/mcp endpoint could otherwise burn the
 * daily quota quickly.
 */
@Injectable()
export class NewsService {
  private readonly cache = new Map<string, Cached>();
  private readonly TTL = 30 * 60 * 1000; // 30 min

  constructor(private readonly client: NewsApiClient) {}

  private map(raw: RawArticle[]): NewsArticle[] {
    return raw.map((a) => ({
      title: a.title,
      source: a.source?.name ?? "",
      url: a.url,
      publishedAt: a.publishedAt,
      summary: a.description ?? null,
    }));
  }

  private async cached(
    key: string,
    fetcher: () => Promise<RawArticle[]>,
  ): Promise<NewsArticle[]> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.TTL) return hit.data;
    const data = this.map(await fetcher());
    this.cache.set(key, { data, at: Date.now() });
    return data;
  }

  search(queryRaw: string): Promise<NewsArticle[]> {
    const query = queryRaw.trim().slice(0, 100);
    return this.cached(`q:${query.toLowerCase()}`, () => this.client.search(query));
  }

  market(): Promise<NewsArticle[]> {
    return this.cached("market", () => this.client.marketHeadlines());
  }
}
