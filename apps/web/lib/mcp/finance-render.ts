/**
 * Markdown renderers for the finance MCP server + console grounding.
 *
 * Unlike the static profile `render.ts`, these are async: the data is fetched
 * (cached) from the Nest API via `lib/finance/api.ts`.
 */

import type { QuoteWire, SeriesLatest, Snapshot } from "@repo/shared";

import { getObservations, getSnapshot } from "@/lib/finance/api";

function fmt(v: number | null | undefined, digits = 2): string {
  return v == null ? "n/a" : v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function seriesLine(s: SeriesLatest): string {
  const date = s.latest?.date?.slice(0, 10) ?? "n/a";
  return `- **${s.label}** (\`${s.id}\`): ${fmt(s.latest?.value)} — ${s.units} _(as of ${date})_`;
}

function byCategory(series: SeriesLatest[], category: string): SeriesLatest[] {
  return series.filter((s) => s.category === category);
}

function moverLine(q: QuoteWire): string {
  const sign = q.changePercent >= 0 ? "+" : "";
  return `- **${q.symbol}**: $${fmt(q.price)} (${sign}${fmt(q.changePercent)}%)`;
}

function renderCategory(snap: Snapshot, category: string, title: string): string {
  const rows = byCategory(snap.series, category).map(seriesLine);
  return [`# ${title}`, "", ...rows, "", `_Data as of ${snap.asOf}_`].join("\n");
}

export async function renderRates(): Promise<string> {
  return renderCategory(await getSnapshot(), "rates", "Rates & Yield Curve");
}

export async function renderInflation(): Promise<string> {
  return renderCategory(await getSnapshot(), "inflation", "Inflation");
}

export async function renderLabor(): Promise<string> {
  return renderCategory(await getSnapshot(), "labor", "Labor Market");
}

export async function renderWatchlist(): Promise<string> {
  const snap = await getSnapshot();
  const sorted = [...snap.quotes].sort((a, b) => b.changePercent - a.changePercent);
  return [
    "# Watchlist — day movers",
    "",
    ...sorted.map(moverLine),
    "",
    `_Data as of ${snap.asOf}_`,
  ].join("\n");
}

export async function renderSnapshot(): Promise<string> {
  const snap = await getSnapshot();
  const groups: Array<[string, string]> = [
    ["rates", "Rates"],
    ["inflation", "Inflation"],
    ["labor", "Labor"],
    ["growth", "Growth & Money"],
    ["mortgage", "Mortgage"],
    ["market", "Market context"],
  ];
  const macro = groups.flatMap(([cat, title]) => {
    const rows = byCategory(snap.series, cat).map(seriesLine);
    return rows.length ? [`## ${title}`, ...rows, ""] : [];
  });
  const movers = [...snap.quotes].sort((a, b) => b.changePercent - a.changePercent);
  const top = movers.slice(0, 5).map(moverLine);
  const bottom = movers.slice(-5).reverse().map(moverLine);
  return [
    "# Financial Dashboard — snapshot",
    "",
    ...macro,
    "## Top movers",
    ...top,
    "",
    "## Laggards",
    ...bottom,
    "",
    `_Data as of ${snap.asOf}. Macro via FRED; equities via Finnhub._`,
  ].join("\n");
}

/** `finance://series/<id>` — observations for one series (recent first). */
export async function renderSeriesObservations(
  id: string,
  limit = 60,
): Promise<string> {
  const { observations } = await getObservations(id, limit);
  if (observations.length === 0) {
    return `No observations found for series \`${id}\`.`;
  }
  const rows = observations.map(
    (o) => `- ${o.date.slice(0, 10)}: ${fmt(o.value)}`,
  );
  return [`# ${id} — last ${observations.length} observations`, "", ...rows].join("\n");
}
