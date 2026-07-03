import { Injectable } from "@nestjs/common";

const BASE = "https://newsapi.org/v2";

export type RawArticle = {
  source: { name?: string };
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
};

/** Thin NewsAPI (newsapi.org) client. Key passed as a header. */
@Injectable()
export class NewsApiClient {
  private key(): string {
    const k = process.env.NEWSAPI_KEY;
    if (!k) throw new Error("NEWSAPI_KEY is not set");
    return k;
  }

  private async get(path: string): Promise<RawArticle[]> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Api-Key": this.key(), "User-Agent": "alek-portfolio" },
    });
    if (!res.ok) throw new Error(`NewsAPI request failed: ${res.status}`);
    const json = (await res.json()) as { articles?: RawArticle[] };
    return json.articles ?? [];
  }

  /**
   * Keyword search, constrained to major financial outlets so results are
   * actual market news (not e.g. dev packages that happen to match the query).
   */
  search(query: string, pageSize = 8): Promise<RawArticle[]> {
    const q = encodeURIComponent(query);
    const domains = [
      "reuters.com",
      "bloomberg.com",
      "cnbc.com",
      "wsj.com",
      "ft.com",
      "marketwatch.com",
      "finance.yahoo.com",
      "fortune.com",
      "businessinsider.com",
      "forbes.com",
    ].join(",");
    return this.get(
      `/everything?q=${q}&domains=${domains}&language=en&sortBy=publishedAt&pageSize=${pageSize}`,
    );
  }

  /** Top US business headlines. */
  marketHeadlines(pageSize = 8): Promise<RawArticle[]> {
    return this.get(
      `/top-headlines?country=us&category=business&pageSize=${pageSize}`,
    );
  }
}
