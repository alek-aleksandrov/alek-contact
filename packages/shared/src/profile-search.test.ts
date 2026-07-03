import { describe, it, expect } from "vitest";

import { searchProfile } from "./profile-search";

describe("searchProfile", () => {
  it("returns [] for an empty or whitespace-only query", () => {
    expect(searchProfile("")).toEqual([]);
    expect(searchProfile("   ")).toEqual([]);
  });

  it("matches a known skill and labels its source", () => {
    const hits = searchProfile("Angular");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.source.startsWith("Skills ·"))).toBe(true);
    expect(hits.some((h) => h.text === "Angular")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(searchProfile("angular")).toEqual(searchProfile("Angular"));
  });

  it("returns [] when nothing matches", () => {
    expect(searchProfile("zzz-nonexistent-term-xyz")).toEqual([]);
  });
});
