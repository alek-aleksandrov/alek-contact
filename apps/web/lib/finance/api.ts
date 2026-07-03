import type {
  LiveIndicator,
  NewsArticle,
  ObservationWire,
  QuoteWire,
  SeriesLatest,
  Snapshot,
} from "@repo/shared";

// Nest.js API base URL (same var the items demo uses). The web app is a pure
// reader — it holds no FRED/Finnhub keys.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getFinance<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/finance/${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Finance API /${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const getSnapshot = () => getFinance<Snapshot>("snapshot");
export const getSeries = () => getFinance<SeriesLatest[]>("series");
export const getQuotes = () => getFinance<QuoteWire[]>("quotes");
export const getObservations = (id: string, limit = 60) =>
  getFinance<{ id: string; observations: ObservationWire[] }>(
    `series/${encodeURIComponent(id)}/observations?limit=${limit}`,
  );

/** Live, on-demand lookups (any ticker / series). Return null when not found. */
async function getLive<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/api/finance/${path}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Finance API /${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const getLiveQuote = (symbol: string) =>
  getLive<QuoteWire>(`quote/${encodeURIComponent(symbol)}`);
export const getLiveIndicator = (id: string) =>
  getLive<LiveIndicator>(`indicator/${encodeURIComponent(id)}`);

/** Market news search (keyword), or top business headlines when omitted. */
export async function searchNews(query?: string): Promise<NewsArticle[]> {
  const path = query ? `news?q=${encodeURIComponent(query)}` : "news";
  const res = await fetch(`${API_URL}/api/finance/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Finance API /${path} failed (${res.status})`);
  return res.json() as Promise<NewsArticle[]>;
}
