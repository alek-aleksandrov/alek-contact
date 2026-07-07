import { describe, it, expect } from "vitest";
import { roundRobin } from "./job-collect";
import type { JobPosting } from "@repo/shared";

const p = (id: string): JobPosting => ({
  id, source: "greenhouse", company: "C", title: "Senior Engineer",
  location: "Remote", url: "x", postedAt: null, body: "b",
});

describe("roundRobin", () => {
  it("interleaves across groups so no group dominates the head", () => {
    const a = [p("a1"), p("a2"), p("a3")];
    const b = [p("b1"), p("b2")];
    const c = [p("c1")];
    const out = roundRobin([a, b, c]).map((x) => x.id);
    expect(out.slice(0, 3)).toEqual(["a1", "b1", "c1"]); // one from each first
    expect(out).toEqual(["a1", "b1", "c1", "a2", "b2", "a3"]);
  });

  it("ignores empty groups", () => {
    expect(roundRobin([[], [p("x1")], []]).map((x) => x.id)).toEqual(["x1"]);
  });
});
