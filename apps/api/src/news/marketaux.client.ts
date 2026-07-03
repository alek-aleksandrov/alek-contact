import { Injectable } from "@nestjs/common";
import type { NewsArticle } from "@repo/shared";

const BASE = "https://api.marketaux.com/v1/news/all";
const PAGE_SIZE = 3; // Marketaux free tier caps `limit` at 3 per request.

type MarketauxEntity = { sentiment_score: number | null };

type MarketauxArticle = {
  title: string;
  description: string | null;
  snippet: string | null;
  url: string;
  published_at: string;
  source: string;
  entities?: MarketauxEntity[];
};

type MarketauxResponse = { data?: MarketauxArticle[] };

/**
 * Marketaux news client — serves both keyword search and general market news.
 *
 * Free-tier realities the queries work around:
 *   - `limit` is capped at 3 articles/request, so we paginate to reach the
 *     ~6–9 headlines the widget/MCP want (safe because results are cached 6h).
 *   - default sort is relevance, which surfaces stale stories, so we force
 *     `sort=published_at` for freshest-first.
 *   - the unfiltered firehose is noisy, so market news is constrained to
 *     `countries=us` + `filter_entities=true`.
 * Each article carries an aggregate `sentiment` (mean of its entities' scores).
 */
@Injectable()
export class MarketauxClient {
  private key(): string {
    const k = process.env.MARKETAUX_KEY;
    if (!k) throw new Error("MARKETAUX_KEY is not set");
    return k;
  }

  /** Keyword search across financial news, freshest first. */
  search(query: string, pages = 2): Promise<NewsArticle[]> {
    return this.fetchPages({ search: query }, pages);
  }

  /** General US market headlines, freshest first. */
  market(pages = 3): Promise<NewsArticle[]> {
    return this.fetchPages({ countries: "us" }, pages);
  }

  /** Fetch and concatenate `pages` pages, stopping early when a page is short. */
  private async fetchPages(
    extra: Record<string, string>,
    pages: number,
  ): Promise<NewsArticle[]> {
    const out: NewsArticle[] = [];
    for (let page = 1; page <= pages; page++) {
      const batch = await this.fetchPage(extra, page);
      out.push(...batch);
      if (batch.length < PAGE_SIZE) break; // no more results
    }
    return out;
  }

  private async fetchPage(
    extra: Record<string, string>,
    page: number,
  ): Promise<NewsArticle[]> {
    const params = new URLSearchParams({
      language: "en",
      filter_entities: "true",
      sort: "published_at",
      limit: String(PAGE_SIZE),
      page: String(page),
      api_token: this.key(),
      ...extra,
    });
    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`Marketaux request failed: ${res.status}`);
    const json = (await res.json()) as MarketauxResponse;
    return (json.data ?? []).map((a) => this.map(a));
  }

  private map(a: MarketauxArticle): NewsArticle {
    return {
      title: a.title,
      source: a.source ?? "",
      url: a.url,
      publishedAt: a.published_at,
      summary: a.description ?? a.snippet ?? null,
      sentiment: this.aggregateSentiment(a.entities),
    };
  }

  /** Mean of the entity sentiment scores, rounded; null when none are scored. */
  private aggregateSentiment(entities?: MarketauxEntity[]): number | null {
    const scores = (entities ?? [])
      .map((e) => e.sentiment_score)
      .filter((s): s is number => typeof s === "number");
    if (scores.length === 0) return null;
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(mean * 1000) / 1000;
  }
}
