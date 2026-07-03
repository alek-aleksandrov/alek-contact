import type {
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
