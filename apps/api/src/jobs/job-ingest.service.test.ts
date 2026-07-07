import { describe, it, expect, vi } from "vitest";
import { JobIngestService } from "./job-ingest.service";
import type { JobPosting } from "@repo/shared";

const posting = (id: string): JobPosting => ({
  id,
  source: "greenhouse",
  company: "Acme",
  title: "Senior Software Engineer",
  location: "Remote",
  url: `https://x/${id}`,
  postedAt: null,
  body: "Build reliable distributed systems with strong backend fundamentals.",
});

function makeService(overrides: Partial<any> = {}) {
  const prisma = {
    jobPosting: {
      upsert: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
    },
  };
  const vectorStore = { addDocuments: vi.fn().mockResolvedValue(undefined) };
  const deps = {
    prisma: prisma as any,
    fetchers: {
      greenhouse: vi.fn().mockResolvedValue([posting("greenhouse:acme:1")]),
      lever: vi.fn().mockResolvedValue([]),
      hn: vi.fn().mockResolvedValue([posting("greenhouse:acme:1")]), // dup id
    },
    getStore: vi.fn().mockResolvedValue(vectorStore),
    ...overrides,
  };
  return { service: new JobIngestService(deps as any), prisma, vectorStore, deps };
}

describe("JobIngestService.collect", () => {
  it("merges sources and dedupes by id", async () => {
    const { service } = makeService();
    const postings = await service.collect();
    expect(postings).toHaveLength(1);
  });
});

describe("JobIngestService.indexPostings", () => {
  it("upserts posting metadata and adds chunk documents", async () => {
    const { service, prisma, vectorStore } = makeService();
    const chunks = await service.indexPostings([posting("greenhouse:acme:1")]);
    expect(prisma.jobPosting.upsert).toHaveBeenCalledTimes(1);
    expect(vectorStore.addDocuments).toHaveBeenCalledTimes(1);
    expect(chunks).toBeGreaterThan(0);
  });

  it("persists rich fields and embeds the preamble text", async () => {
    const { service, prisma, vectorStore } = makeService();
    const rich = {
      ...posting("greenhouse:stripe:1"),
      workplace: "Remote",
      department: "Payments",
      salary: "$180k",
    };
    await service.indexPostings([rich]);
    const upsertArg = prisma.jobPosting.upsert.mock.calls[0][0];
    expect(upsertArg.create.workplace).toBe("Remote");
    expect(upsertArg.create.department).toBe("Payments");
    const docs = vectorStore.addDocuments.mock.calls[0][0];
    expect(docs[0].pageContent).toContain("Remote"); // preamble embedded
    expect(docs[0].metadata.workplace).toBe("Remote"); // metadata for citations
  });
});

describe("JobIngestService.ingest", () => {
  it("falls back to the seed corpus when all sources are empty", async () => {
    const { service } = makeService({
      fetchers: {
        greenhouse: vi.fn().mockResolvedValue([]),
        lever: vi.fn().mockResolvedValue([]),
        hn: vi.fn().mockResolvedValue([]),
      },
    });
    const result = await service.ingest();
    expect(result.postings).toBeGreaterThanOrEqual(8); // seed size
  });
});
