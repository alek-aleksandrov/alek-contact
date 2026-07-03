import { Injectable } from "@nestjs/common";

export type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  fetchedAt: Date;
};

/** Thin Finnhub client for real-time quotes. */
@Injectable()
export class FinnhubClient {
  private key(): string {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) throw new Error("FINNHUB_API_KEY is not set");
    return key;
  }

  async getQuote(symbol: string): Promise<QuoteData> {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.key()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Finnhub quote ${symbol} failed: ${res.status}`);
    // Finnhub /quote: c=current, d=change, dp=%change, h/l/o=high/low/open, pc=prevClose, t=unix.
    const j = (await res.json()) as {
      c: number;
      d: number | null;
      dp: number | null;
      h: number;
      l: number;
      o: number;
      pc: number;
      t: number;
    };
    return {
      price: j.c,
      change: j.d ?? 0,
      changePercent: j.dp ?? 0,
      open: j.o ?? null,
      high: j.h ?? null,
      low: j.l ?? null,
      prevClose: j.pc ?? null,
      fetchedAt: j.t ? new Date(j.t * 1000) : new Date(),
    };
  }
}
