import type { SeriesLatest } from "@repo/shared";

export function bySeriesId(
  series: SeriesLatest[],
  id: string,
): SeriesLatest | undefined {
  return series.find((s) => s.id === id);
}

/** Format a number with up to `digits` decimals, thousands-separated. */
export function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/**
 * Year-over-year % change from a spark that ends at the latest value.
 * Needs ≥13 monthly points; returns null otherwise.
 */
export function yoy(spark: number[]): number | null {
  if (spark.length < 13) return null;
  const latest = spark[spark.length - 1];
  const yearAgo = spark[spark.length - 13];
  if (yearAgo === 0) return null;
  return (latest / yearAgo - 1) * 100;
}
