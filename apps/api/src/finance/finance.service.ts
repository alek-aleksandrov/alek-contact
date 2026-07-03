import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  ObservationWire,
  QuoteWire,
  SeriesLatest,
  Snapshot,
} from "@repo/shared";

import { PrismaService } from "../prisma/prisma.service";
import { FRED_SERIES } from "../config/series.config";

const SPARK_POINTS = 24;
const LABELS = new Map(FRED_SERIES.map((s) => [s.id, s.label]));

/** Prisma Decimal (or null) → plain number (or null) for the wire. */
function num(d: Prisma.Decimal | null): number | null {
  return d == null ? null : Number(d);
}

/**
 * Read-only layer over Postgres. NEVER hits FRED/Finnhub — those are populated
 * by the ingest/poll services. Every value is serialized Decimal→number and
 * Date→ISO string at this boundary (mirrors items.service.ts) so the output
 * matches the numeric `@repo/shared` wire types; skipping this silently breaks
 * the movers sort and the yield-curve-inversion (`T10Y2Y < 0`) comparison.
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeriesLatest(): Promise<SeriesLatest[]> {
    const series = await this.prisma.fredSeries.findMany({
      orderBy: { id: "asc" },
      include: {
        observations: { orderBy: { date: "desc" }, take: SPARK_POINTS },
      },
    });
    return series.map((s) => {
      const obs = s.observations; // date desc
      const latest: ObservationWire | null = obs[0]
        ? { date: obs[0].date.toISOString(), value: num(obs[0].value) }
        : null;
      const previous: ObservationWire | null = obs[1]
        ? { date: obs[1].date.toISOString(), value: num(obs[1].value) }
        : null;
      const spark = [...obs]
        .reverse()
        .map((o) => num(o.value))
        .filter((v): v is number => v != null);
      return {
        id: s.id,
        label: LABELS.get(s.id) ?? s.title,
        category: s.category,
        units: s.units,
        frequency: s.frequency,
        latest,
        previous,
        spark,
      };
    });
  }

  async getObservations(
    id: string,
    opts: { limit?: number; from?: Date; maxPoints?: number } = {},
  ): Promise<{ id: string; observations: ObservationWire[] }> {
    const hasRange = opts.from != null;
    // Range view = chronological (for charts); default view = recent-first (for MCP).
    const take = hasRange ? undefined : (opts.limit ?? 120);
    const rows = await this.prisma.fredObservation.findMany({
      where: { seriesId: id, ...(opts.from ? { date: { gte: opts.from } } : {}) },
      orderBy: { date: hasRange ? "asc" : "desc" },
      ...(take ? { take } : {}),
    });
    let observations = rows.map((o) => ({
      date: o.date.toISOString(),
      value: num(o.value),
    }));
    // Downsample dense ranges (e.g. 5Y of daily data) to keep payload + sparkline light.
    if (opts.maxPoints && observations.length > opts.maxPoints) {
      const step = Math.ceil(observations.length / opts.maxPoints);
      observations = observations.filter((_, i) => i % step === 0);
    }
    return { id, observations };
  }

  async getQuotes(): Promise<QuoteWire[]> {
    const quotes = await this.prisma.quote.findMany();
    return quotes
      .map((q) => ({
        symbol: q.symbol,
        price: Number(q.price),
        change: Number(q.change),
        changePercent: Number(q.changePercent),
        open: num(q.open),
        high: num(q.high),
        low: num(q.low),
        prevClose: num(q.prevClose),
        fetchedAt: q.fetchedAt.toISOString(),
      }))
      .sort((a, b) => b.changePercent - a.changePercent);
  }

  async getSnapshot(): Promise<Snapshot> {
    const [series, quotes] = await Promise.all([
      this.getSeriesLatest(),
      this.getQuotes(),
    ]);
    return { series, quotes, asOf: new Date().toISOString() };
  }
}
