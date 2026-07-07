import { describe, it, expect } from "vitest";
import { GREENHOUSE_COMPANIES, MAX_POSTINGS, inferWorkplace } from "./companies.config";

describe("companies.config", () => {
  it("has a broad verified Greenhouse list and a 500 cap", () => {
    expect(GREENHOUSE_COMPANIES).toContain("stripe");
    expect(GREENHOUSE_COMPANIES).toContain("databricks");
    expect(GREENHOUSE_COMPANIES.length).toBeGreaterThanOrEqual(12);
    expect(GREENHOUSE_COMPANIES).not.toContain("plaid"); // dead board
    expect(MAX_POSTINGS).toBe(500);
  });
});

describe("inferWorkplace", () => {
  it("classifies from a location string", () => {
    expect(inferWorkplace("Remote - US")).toBe("Remote");
    expect(inferWorkplace("San Francisco, CA (Hybrid)")).toBe("Hybrid");
    expect(inferWorkplace("New York, NY")).toBe("Onsite");
    expect(inferWorkplace("")).toBeNull();
    expect(inferWorkplace(null)).toBeNull();
  });
});
