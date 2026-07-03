/**
 * Types shared between the Next.js frontend (apps/web) and the Nest.js API
 * (apps/api). Kept framework-agnostic and dependency-free so both an ESM and a
 * CommonJS consumer can use it. Built to CommonJS in dist/.
 */

// Profile content (single source of truth) + its renderers, shared so both the
// site pages AND the Nest-hosted "Ask About Alek" MCP server render identical text.
export * from "./site";
export * from "./experience";
export * from "./projects";
export * from "./profile-render";
export * from "./profile-search";

/** An item as returned by the API (dates serialized as ISO strings over the wire). */
export type Item = {
  id: string;
  title: string;
  createdAt: string;
};

/** Payload accepted by POST /api/items. */
export type CreateItemInput = {
  title: string;
};

// ---- Financial dashboard wire types -----------------------------------------
// Numbers are plain `number` and dates are ISO `string` (never Prisma Decimal),
// so both the ESM web app and the CJS API can consume them directly.

export type ObservationWire = { date: string; value: number | null };

/** A FRED series with its latest value + a short trailing window for sparklines. */
export type SeriesLatest = {
  id: string;
  label: string;
  category: string;
  units: string;
  frequency: string;
  latest: ObservationWire | null;
  previous: ObservationWire | null;
  /** Oldest→newest numeric values for a sparkline (nulls dropped). */
  spark: number[];
};

/** A real-time equity quote snapshot. */
export type QuoteWire = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  fetchedAt: string;
};

/** The single payload the dashboard widgets, MCP server, and console all consume. */
export type Snapshot = {
  series: SeriesLatest[];
  /** Watchlist quotes, sorted by day % change (movers order). */
  quotes: QuoteWire[];
  asOf: string;
};

/** A live, on-demand FRED series lookup (any series id, latest value only). */
export type LiveIndicator = {
  id: string;
  label: string;
  units: string;
  latest: ObservationWire | null;
};

/** A market news article (from a news search). */
export type NewsArticle = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string | null;
};
