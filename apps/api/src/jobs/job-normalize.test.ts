// apps/api/src/jobs/job-normalize.test.ts
import { describe, it, expect } from "vitest";
import {
  stripHtml,
  isEngineeringRole,
  dedupeById,
  normalizeGreenhouse,
  normalizeLever,
  normalizeHn,
  buildEmbedText,
} from "./job-normalize";
import type { JobPosting } from "@repo/shared";

describe("stripHtml", () => {
  it("removes tags and decodes common entities, collapsing whitespace", () => {
    expect(stripHtml("<p>Hello&nbsp;<b>world</b></p>\n\n<p>Two</p>")).toBe(
      "Hello world Two",
    );
    expect(stripHtml("R&amp;D &lt;team&gt;")).toBe("R&D <team>");
    expect(stripHtml("we&rsquo;re hiring")).toBe("we're hiring");
    expect(stripHtml("St. Jude Children&#x27;s")).toBe("St. Jude Children's");
  });
});

describe("isEngineeringRole", () => {
  it("accepts senior/AI engineering titles", () => {
    expect(isEngineeringRole("Senior Software Engineer")).toBe(true);
    expect(isEngineeringRole("Staff ML Engineer")).toBe(true);
    expect(isEngineeringRole("AI Engineer, Platform")).toBe(true);
  });
  it("rejects non-engineering or junior-noise titles", () => {
    expect(isEngineeringRole("Sales Development Representative")).toBe(false);
    expect(isEngineeringRole("Recruiter")).toBe(false);
  });
  it("does not match short seniority tokens inside unrelated words", () => {
    expect(isEngineeringRole("Backend Engineer, Retail Systems")).toBe(false);
    expect(isEngineeringRole("Software Engineer, Sustainability")).toBe(false);
  });
});

describe("dedupeById", () => {
  it("keeps the first occurrence of each id", () => {
    const a = { id: "x", title: "one" } as JobPosting;
    const b = { id: "x", title: "two" } as JobPosting;
    const c = { id: "y", title: "three" } as JobPosting;
    expect(dedupeById([a, b, c])).toEqual([a, c]);
  });
});

describe("normalizeGreenhouse", () => {
  it("maps a Greenhouse job to a JobPosting with a namespaced id", () => {
    const out = normalizeGreenhouse("acme", {
      id: 123,
      title: "Senior Backend Engineer",
      absolute_url: "https://boards.greenhouse.io/acme/jobs/123",
      location: { name: "Remote - US" },
      content: "&lt;p&gt;Build &lt;b&gt;systems&lt;/b&gt;&lt;/p&gt;",
      updated_at: "2026-06-01T00:00:00Z",
    });
    expect(out.id).toBe("greenhouse:acme:123");
    expect(out.source).toBe("greenhouse");
    expect(out.company).toBe("acme");
    expect(out.location).toBe("Remote - US");
    expect(out.url).toBe("https://boards.greenhouse.io/acme/jobs/123");
    expect(out.body).toContain("Build systems");
    expect(out.postedAt).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("normalizeLever", () => {
  it("maps a Lever posting to a JobPosting", () => {
    const out = normalizeLever("beta", {
      id: "abc-def",
      text: "Staff Frontend Engineer",
      hostedUrl: "https://jobs.lever.co/beta/abc-def",
      categories: { location: "New York" },
      descriptionPlain: "Own the design system.",
      createdAt: 1780000000000,
    });
    expect(out.id).toBe("lever:beta:abc-def");
    expect(out.source).toBe("lever");
    expect(out.location).toBe("New York");
    expect(out.body).toBe("Own the design system.");
    expect(out.postedAt).toBe(new Date(1780000000000).toISOString());
  });
});

describe("normalizeHn", () => {
  it("parses a 'Company | Role | Location' comment into a posting", () => {
    const out = normalizeHn({
      id: 42,
      text: "Acme Corp | Senior Software Engineer | Remote | We build &gt; things",
    });
    expect(out).not.toBeNull();
    expect(out!.id).toBe("hn:42");
    expect(out!.source).toBe("hn");
    expect(out!.company).toBe("Acme Corp");
    expect(out!.title).toBe("Senior Software Engineer");
    expect(out!.body).toContain("We build > things");
  });
  it("returns null for a deleted/empty comment", () => {
    expect(normalizeHn({ id: 43, text: "" })).toBeNull();
    expect(normalizeHn({ id: 44 })).toBeNull();
  });
});

describe("normalizeGreenhouse richness", () => {
  it("uses company_name, department, workplace, tags", () => {
    const out = normalizeGreenhouse("stripe", {
      id: 1, title: "Senior Software Engineer",
      absolute_url: "https://stripe.com/jobs/1",
      company_name: "Stripe",
      location: { name: "Remote - US" },
      departments: [{ name: "Payments" }],
      offices: [{ name: "US" }],
      metadata: [],
      content: "Build APIs",
    });
    expect(out.company).toBe("Stripe");            // display name, not slug
    expect(out.department).toBe("Payments");
    expect(out.workplace).toBe("Remote");
    expect(out.tags).toEqual(expect.arrayContaining(["Payments", "US"]));
  });
});

describe("normalizeLever richness", () => {
  it("maps categories/workplaceType/salaryRange when present", () => {
    const out = normalizeLever("acme", {
      id: "a", text: "Staff ML Engineer", hostedUrl: "https://jobs.lever.co/acme/a",
      categories: { location: "SF", team: "ML", commitment: "Full-time" },
      workplaceType: "hybrid",
      salaryRange: { min: 200000, max: 260000, currency: "USD" },
      descriptionPlain: "Models",
    });
    expect(out.department).toBe("ML");
    expect(out.commitment).toBe("Full-time");
    expect(out.workplace).toBe("Hybrid");
    expect(out.salary).toContain("200");
  });
});

describe("buildEmbedText", () => {
  it("prepends a compact metadata preamble to the body", () => {
    const text = buildEmbedText({
      id: "greenhouse:stripe:1", source: "greenhouse", company: "Stripe",
      title: "Senior Software Engineer", location: "Remote - US",
      url: "x", postedAt: null, body: "Build APIs.",
      department: "Payments", workplace: "Remote", salary: "$180k–$240k",
    });
    expect(text.startsWith("[")).toBe(true);
    expect(text).not.toContain("Stripe"); // company deliberately excluded from embed text
    expect(text).toContain("Remote");
    expect(text).toContain("Payments");
    expect(text).toContain("Build APIs.");
  });
});
