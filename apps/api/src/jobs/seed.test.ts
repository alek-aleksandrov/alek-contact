// apps/api/src/jobs/seed.test.ts
import { describe, it, expect } from "vitest";
import { loadSeedPostings } from "./seed";

describe("loadSeedPostings", () => {
  it("returns a non-empty, well-formed corpus", () => {
    const postings = loadSeedPostings();
    expect(postings.length).toBeGreaterThanOrEqual(8);
    for (const p of postings) {
      expect(p.id).toMatch(/^(greenhouse|lever|hn):/);
      expect(p.title).toBeTruthy();
      expect(p.body.length).toBeGreaterThan(20);
    }
  });
});
