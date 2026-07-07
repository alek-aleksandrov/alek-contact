import { describe, it, expect } from "vitest";
import type { JobPosting } from "@repo/shared";
import { contentHash } from "./content-hash";

const base: JobPosting = {
  id: "greenhouse:acme:1",
  source: "greenhouse",
  company: "Acme",
  title: "Senior Software Engineer",
  location: "Remote",
  url: "https://x/1",
  postedAt: null,
  body: "Build distributed systems.",
};

describe("contentHash", () => {
  it("is a 64-char hex string", () => {
    expect(contentHash(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for identical embed-text", () => {
    expect(contentHash(base)).toBe(contentHash({ ...base }));
  });

  it("changes when the body changes", () => {
    const changed = { ...base, body: "Build reliable payment systems." };
    expect(contentHash(changed)).not.toBe(contentHash(base));
  });

  it("changes when a preamble field (workplace) changes", () => {
    // buildEmbedText folds workplace/department/salary/commitment into a preamble.
    const a = { ...base, workplace: "Remote" };
    const b = { ...base, workplace: "Onsite" };
    expect(contentHash(a)).not.toBe(contentHash(b));
  });
});
