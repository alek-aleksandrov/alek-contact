/**
 * Builds the grounding system prompt for the dashboard console. Analogous to
 * `profile-context.ts`, but async — it grounds the model in a LIVE snapshot of
 * the dashboard's macro + market data (fetched, cached) rather than static text.
 */

import type { SeriesLatest } from "@repo/shared";

import { getSnapshot } from "@/lib/finance/api";

function seriesLine(s: SeriesLatest): string {
  const date = s.latest?.date?.slice(0, 10) ?? "n/a";
  const v = s.latest?.value;
  return `- ${s.label} (${s.id}): ${v ?? "n/a"} ${s.units} — as of ${date}`;
}

/** Compact markdown snapshot of the current numbers (a few KB — no RAG). */
export async function buildDashboardContext(): Promise<string> {
  const snap = await getSnapshot();
  const macro = snap.series.map(seriesLine).join("\n");
  const movers = [...snap.quotes]
    .sort((a, b) => b.changePercent - a.changePercent)
    .map(
      (q) =>
        `- ${q.symbol}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`,
    )
    .join("\n");

  // Derived signals computed server-side, so a small model doesn't have to
  // interpret (and misinterpret) the raw numbers.
  const signals: string[] = [];
  const spread = snap.series.find((s) => s.id === "T10Y2Y")?.latest?.value;
  if (spread != null) {
    signals.push(
      `- Yield curve is ${spread < 0 ? "INVERTED" : "NOT inverted"} — the 10Y-2Y spread is ${spread >= 0 ? "+" : ""}${spread}% (inverted ONLY when this spread is negative).`,
    );
  }

  return [
    "=== CURRENT MACRO INDICATORS (FRED) ===",
    macro,
    "",
    "=== WATCHLIST QUOTES (day movers first) ===",
    movers,
    "",
    ...(signals.length ? ["=== DERIVED SIGNALS (authoritative) ===", ...signals, ""] : []),
    `Data as of ${snap.asOf}.`,
  ].join("\n");
}

/** System prompt: persona + guardrails + the live snapshot. */
export async function buildDashboardSystemPrompt(): Promise<string> {
  return [
    "You are the assistant embedded on Alek's financial dashboard.",
    "You answer questions about the CURRENT macro and market data in the snapshot below.",
    "",
    "Rules:",
    "- Use ONLY the snapshot data below for current values. Do not invent numbers or pull figures from outside knowledge.",
    "- When useful, briefly explain what a figure means (e.g. what an inverted yield curve implies).",
    "- Be concise and specific; cite the actual number and its date.",
    "- Politely decline anything not about this dashboard's data. This is not investment advice.",
    "",
    await buildDashboardContext(),
  ].join("\n");
}
