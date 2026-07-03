/**
 * Curated data catalog for the financial dashboard.
 *
 * FRED macro series (nightly archival ingest) + the equity watchlist (Finnhub,
 * market-hours poll). Both are small and static — edit here to change coverage.
 */

export type FredCategory =
  | "rates"
  | "inflation"
  | "labor"
  | "growth"
  | "mortgage"
  | "market";

export type FredSeriesDef = {
  id: string; // FRED series_id
  category: FredCategory;
  label: string;
};

/**
 * ~18 series. NOTE: FRED `SP500` is deliberately excluded — it is
 * copyright-restricted / personal-use-only, and this is a public site. The S&P
 * 500 level comes from the equity API via `SPY`. `VIXCLS` (CBOE) is fine.
 */
export const FRED_SERIES: FredSeriesDef[] = [
  { id: "DFF", category: "rates", label: "Effective Federal Funds Rate" },
  { id: "FEDFUNDS", category: "rates", label: "Federal Funds Rate (monthly)" },
  { id: "DGS3MO", category: "rates", label: "3-Month Treasury Yield" },
  { id: "DGS2", category: "rates", label: "2-Year Treasury Yield" },
  { id: "DGS10", category: "rates", label: "10-Year Treasury Yield" },
  { id: "DGS30", category: "rates", label: "30-Year Treasury Yield" },
  { id: "T10Y2Y", category: "rates", label: "10Y-2Y Treasury Spread" },
  { id: "CPIAUCSL", category: "inflation", label: "CPI (All Items)" },
  { id: "CPILFESL", category: "inflation", label: "Core CPI" },
  { id: "PCEPI", category: "inflation", label: "PCE Price Index" },
  { id: "UNRATE", category: "labor", label: "Unemployment Rate" },
  { id: "PAYEMS", category: "labor", label: "Nonfarm Payrolls" },
  { id: "GDPC1", category: "growth", label: "Real GDP" },
  { id: "M2SL", category: "growth", label: "M2 Money Supply" },
  { id: "UMCSENT", category: "growth", label: "Consumer Sentiment (UMich)" },
  { id: "MORTGAGE30US", category: "mortgage", label: "30-Year Fixed Mortgage Rate" },
  { id: "VIXCLS", category: "market", label: "CBOE Volatility Index (VIX)" },
];

/** Equity watchlist. SPY doubles as the S&P 500 proxy. ~20 symbols → well under 60/min. */
export const WATCHLIST: string[] = [
  "SPY", "QQQ", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO",
  "JPM", "V", "WMT", "XOM", "JNJ", "PG", "MA", "HD", "COST", "NFLX",
];
