import { describe, it, expect } from "vitest";
import { SOURCE_LABELS, type JobSource, type JobPosting, type JobCitation } from "./jobs";

describe("SOURCE_LABELS", () => {
  it("has a human label for every source", () => {
    const sources: JobSource[] = ["greenhouse", "lever", "hn"];
    for (const s of sources) {
      expect(SOURCE_LABELS[s]).toBeTruthy();
    }
    expect(SOURCE_LABELS.hn).toBe("Hacker News");
  });
});

describe("rich JobPosting fields", () => {
  it("accepts optional richness fields", () => {
    const p: JobPosting = {
      id: "greenhouse:stripe:1", source: "greenhouse", company: "Stripe",
      title: "Senior Software Engineer", location: "Remote - US",
      url: "https://x", postedAt: null, body: "…",
      department: "Payments", commitment: "Full-time", workplace: "Remote",
      salary: "$180k–$240k", tags: ["Engineering", "US"],
    };
    const c: JobCitation = {
      id: p.id, source: "greenhouse", company: "Stripe", title: p.title,
      url: p.url, score: 0.8, workplace: "Remote", salary: "$180k–$240k", department: "Payments",
    };
    expect(p.workplace).toBe("Remote");
    expect(c.department).toBe("Payments");
  });
});
