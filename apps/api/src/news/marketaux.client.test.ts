import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { MarketauxClient } from "./marketaux.client";

type RawEntity = { sentiment_score: number | null };
type RawArticle = {
  title: string;
  description: string | null;
  snippet: string | null;
  url: string;
  published_at: string;
  source: string;
  entities: RawEntity[];
};

/** A fetch mock that returns one { data } page per call, in order. */
function mockFetchPages(pages: RawArticle[][]) {
  const fn = vi.fn();
  for (const data of pages) {
    fn.mockResolvedValueOnce({ ok: true, json: async () => ({ data }) });
  }
  return fn;
}

function raw(over: Partial<RawArticle> = {}): RawArticle {
  return {
    title: "T",
    description: "D",
    snippet: "S",
    url: "https://x",
    published_at: "2026-07-03T00:00:00Z",
    source: "yahoo",
    entities: [],
    ...over,
  };
}

describe("MarketauxClient", () => {
  beforeEach(() => {
    process.env.MARKETAUX_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("maps an article and aggregates entity sentiment (mean, 3dp)", async () => {
    const article = raw({
      entities: [{ sentiment_score: 0.5 }, { sentiment_score: 0.1 }],
    });
    vi.stubGlobal("fetch", mockFetchPages([[article]]));

    const [a] = await new MarketauxClient().search("nvidia", 1);

    expect(a).toEqual({
      title: "T",
      source: "yahoo",
      url: "https://x",
      publishedAt: "2026-07-03T00:00:00Z",
      summary: "D",
      sentiment: 0.3,
    });
  });

  it("returns null sentiment and falls back to snippet when needed", async () => {
    const article = raw({ description: null, snippet: null, entities: [] });
    vi.stubGlobal("fetch", mockFetchPages([[article]]));

    const [a] = await new MarketauxClient().search("q", 1);

    expect(a.sentiment).toBeNull();
    expect(a.summary).toBeNull();
  });

  it("paginates and stops early when a page is short", async () => {
    const fullPage = [raw({ url: "u1" }), raw({ url: "u2" }), raw({ url: "u3" })];
    const shortPage = [raw({ url: "u4" })];
    const fetchMock = mockFetchPages([fullPage, shortPage]);
    vi.stubGlobal("fetch", fetchMock);

    const res = await new MarketauxClient().market(3);

    expect(res).toHaveLength(4);
    expect(fetchMock).toHaveBeenCalledTimes(2); // stopped after the short page
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(new MarketauxClient().search("q", 1)).rejects.toThrow(
      "Marketaux request failed: 429",
    );
  });
});
