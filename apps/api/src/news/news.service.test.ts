import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NewsArticle } from "@repo/shared";

import { NewsService } from "./news.service";
import type { MarketauxClient } from "./marketaux.client";

const TTL = 6 * 60 * 60 * 1000;

const sample: NewsArticle = {
  title: "t",
  source: "s",
  url: "u",
  publishedAt: "2026-07-03T00:00:00Z",
  summary: null,
  sentiment: null,
};

function makeService(market = vi.fn()) {
  const fake = { search: vi.fn(), market } as unknown as MarketauxClient;
  return { svc: new NewsService(fake), market };
}

describe("NewsService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("caches within the 6h TTL (no refetch on the second call)", async () => {
    const { svc, market } = makeService(vi.fn().mockResolvedValue([sample]));
    await svc.market();
    await svc.market();
    expect(market).toHaveBeenCalledTimes(1);
  });

  it("refetches after the TTL expires", async () => {
    const { svc, market } = makeService(vi.fn().mockResolvedValue([sample]));
    await svc.market();
    vi.advanceTimersByTime(TTL + 1);
    await svc.market();
    expect(market).toHaveBeenCalledTimes(2);
  });

  it("serves the stale cache when a refresh throws", async () => {
    const market = vi
      .fn()
      .mockResolvedValueOnce([sample])
      .mockRejectedValueOnce(new Error("boom"));
    const { svc } = makeService(market);

    const first = await svc.market();
    vi.advanceTimersByTime(TTL + 1);
    const second = await svc.market();

    expect(second).toEqual(first);
  });

  it("rethrows when the fetch fails and there is no cache", async () => {
    const { svc } = makeService(vi.fn().mockRejectedValue(new Error("boom")));
    await expect(svc.market()).rejects.toThrow("boom");
  });
});
