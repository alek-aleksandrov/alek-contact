import { describe, it, expect, vi } from "vitest";

import { FinanceService } from "./finance.service";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * Build a fake PrismaService and return the individual `findMany` mocks so the
 * tests can drive/inspect them without reaching through the `PrismaService`
 * type (which doesn't structurally expose the model delegates on a cast).
 */
function makePrisma() {
  const quote = { findMany: vi.fn() };
  const fredObservation = { findMany: vi.fn() };
  const fredSeries = { findMany: vi.fn() };
  const prisma = { quote, fredObservation, fredSeries } as unknown as PrismaService;
  return { prisma, quote, fredObservation, fredSeries };
}

describe("FinanceService.getQuotes", () => {
  it("serializes Decimals to numbers and sorts by changePercent desc", async () => {
    const { prisma, quote } = makePrisma();
    quote.findMany.mockResolvedValue([
      {
        symbol: "A", price: 1, change: 1, changePercent: 1,
        open: 1, high: 1, low: 1, prevClose: 1,
        fetchedAt: new Date("2026-07-03T00:00:00Z"),
      },
      {
        symbol: "B", price: 2, change: 2, changePercent: 5,
        open: null, high: null, low: null, prevClose: null,
        fetchedAt: new Date("2026-07-03T00:00:00Z"),
      },
    ]);

    const quotes = await new FinanceService(prisma).getQuotes();

    expect(quotes.map((q) => q.symbol)).toEqual(["B", "A"]);
    expect(quotes[0].changePercent).toBe(5);
    expect(quotes[1].open).toBe(1);
    expect(quotes[0].open).toBeNull();
  });
});

describe("FinanceService.getObservations", () => {
  it("downsamples when rows exceed maxPoints", async () => {
    const { prisma, fredObservation } = makePrisma();
    const rows = Array.from({ length: 100 }, (_, i) => ({
      date: new Date(2026, 0, 1 + i),
      value: i,
    }));
    fredObservation.findMany.mockResolvedValue(rows);

    const { observations } = await new FinanceService(prisma).getObservations(
      "X",
      { maxPoints: 10 },
    );

    // step = ceil(100 / 10) = 10 -> keeps indices 0,10,...,90 = 10 points
    expect(observations).toHaveLength(10);
  });

  it("orders ascending for a range view and descending by default", async () => {
    const { prisma, fredObservation } = makePrisma();
    fredObservation.findMany.mockResolvedValue([]);
    const svc = new FinanceService(prisma);

    await svc.getObservations("X", { from: new Date("2026-01-01") });
    await svc.getObservations("X");

    const calls = fredObservation.findMany.mock.calls;
    expect(calls[0][0]?.orderBy).toEqual({ date: "asc" });
    expect(calls[1][0]?.orderBy).toEqual({ date: "desc" });
  });
});
