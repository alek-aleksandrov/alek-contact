import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BadRequestException } from "@nestjs/common";

import { LiveService } from "./live.service";
import type { FinnhubClient } from "../market/finnhub.client";
import type { FredClient } from "../fred/fred.client";

const quote = {
  price: 100,
  change: 1,
  changePercent: 1,
  open: 99,
  high: 101,
  low: 98,
  prevClose: 99,
  fetchedAt: new Date("2026-07-03T00:00:00Z"),
};

function makeService(getQuote = vi.fn()) {
  const finnhub = { getQuote } as unknown as FinnhubClient;
  const fred = {} as unknown as FredClient;
  return { svc: new LiveService(finnhub, fred), getQuote };
}

describe("LiveService.getLiveQuote", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("throws BadRequestException on an invalid symbol", async () => {
    const { svc } = makeService();
    await expect(svc.getLiveQuote("1bad")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("returns null for an unknown symbol (price 0 / prevClose 0)", async () => {
    const { svc } = makeService(
      vi.fn().mockResolvedValue({ ...quote, price: 0, prevClose: 0 }),
    );
    expect(await svc.getLiveQuote("ZZZZ")).toBeNull();
  });

  it("maps a valid quote to the wire shape (ISO fetchedAt, upper symbol)", async () => {
    const { svc } = makeService(vi.fn().mockResolvedValue(quote));
    const wire = await svc.getLiveQuote("aapl");
    expect(wire).toMatchObject({
      symbol: "AAPL",
      price: 100,
      prevClose: 99,
      fetchedAt: "2026-07-03T00:00:00.000Z",
    });
  });

  it("caches within the 30s TTL and refetches after it expires", async () => {
    const getQuote = vi.fn().mockResolvedValue(quote);
    const { svc } = makeService(getQuote);
    await svc.getLiveQuote("AAPL");
    await svc.getLiveQuote("AAPL");
    expect(getQuote).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_001);
    await svc.getLiveQuote("AAPL");
    expect(getQuote).toHaveBeenCalledTimes(2);
  });
});
