import { BadRequestException, Injectable } from "@nestjs/common";
import type { LiveIndicator, QuoteWire } from "@repo/shared";

import { FredClient } from "../fred/fred.client";
import { FinnhubClient } from "../market/finnhub.client";

type Cached<T> = { data: T; at: number };

/**
 * Live, on-demand lookups for ANY ticker / FRED series (not just the cached
 * watchlist) — the data the finance MCP tools expose so an LLM can ask for
 * arbitrary quotes/indicators. Every lookup hits an upstream API, so each is
 * wrapped in a short in-memory TTL cache: the /finance/mcp endpoint is public,
 * and this dedupes bursts to stay well under the free-tier rate limits.
 */
@Injectable()
export class LiveService {
  private readonly quoteCache = new Map<string, Cached<QuoteWire>>();
  private readonly indicatorCache = new Map<string, Cached<LiveIndicator>>();
  private readonly QUOTE_TTL = 30_000; // 30s — quotes move fast
  private readonly INDICATOR_TTL = 300_000; // 5m — macro series update slowly

  constructor(
    private readonly finnhub: FinnhubClient,
    private readonly fred: FredClient,
  ) {}

  /** Live quote for any US ticker. Returns null for an unknown/unsupported symbol. */
  async getLiveQuote(symbolRaw: string): Promise<QuoteWire | null> {
    const symbol = symbolRaw.trim().toUpperCase();
    if (!/^[A-Z][A-Z.\-]{0,9}$/.test(symbol)) {
      throw new BadRequestException("Invalid ticker symbol.");
    }
    const hit = this.quoteCache.get(symbol);
    if (hit && Date.now() - hit.at < this.QUOTE_TTL) return hit.data;

    const q = await this.finnhub.getQuote(symbol);
    // Finnhub returns c=0/pc=0 for symbols it doesn't recognize.
    if (q.price === 0 && (q.prevClose == null || q.prevClose === 0)) {
      return null;
    }
    const wire: QuoteWire = {
      symbol,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      open: q.open,
      high: q.high,
      low: q.low,
      prevClose: q.prevClose,
      fetchedAt: q.fetchedAt.toISOString(),
    };
    this.quoteCache.set(symbol, { data: wire, at: Date.now() });
    return wire;
  }

  /** Live latest value for any FRED series. Returns null if the id is unknown. */
  async getLiveIndicator(idRaw: string): Promise<LiveIndicator | null> {
    const id = idRaw.trim();
    if (!/^[A-Za-z0-9]{1,25}$/.test(id)) {
      throw new BadRequestException("Invalid FRED series id.");
    }
    const hit = this.indicatorCache.get(id);
    if (hit && Date.now() - hit.at < this.INDICATOR_TTL) return hit.data;

    let data: LiveIndicator;
    try {
      const meta = await this.fred.getSeries(id);
      const obs = await this.fred.getObservations(id); // FRED order = date ascending
      let latest: { date: string; value: number | null } | null = null;
      for (let i = obs.length - 1; i >= 0; i--) {
        if (obs[i].value != null) {
          latest = { date: obs[i].date.toISOString(), value: obs[i].value };
          break;
        }
      }
      data = { id, label: meta.title, units: meta.units, latest };
    } catch {
      return null; // unknown series id (FRED 400) or upstream hiccup
    }
    this.indicatorCache.set(id, { data, at: Date.now() });
    return data;
  }
}
