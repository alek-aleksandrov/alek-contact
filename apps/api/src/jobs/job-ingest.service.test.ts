import { describe, it, expect, vi } from "vitest";
import { JobIngestService } from "./job-ingest.service";
import { contentHash } from "./content-hash";
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
      findUnique: vi.fn().mockResolvedValue(null), // absent by default = new posting
    },
  };
  const vectorStore = {
    addDocuments: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
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

  it("skips embedding when the stored contentHash is unchanged", async () => {
    const { service, prisma, vectorStore } = makeService();
    const p = posting("greenhouse:acme:1");
    prisma.jobPosting.findUnique.mockResolvedValue({ contentHash: contentHash(p) });

    const chunks = await service.indexPostings([p]);

    expect(vectorStore.addDocuments).not.toHaveBeenCalled();
    expect(vectorStore.delete).not.toHaveBeenCalled();
    expect(prisma.jobPosting.upsert).toHaveBeenCalledTimes(1); // metadata still refreshed
    expect(chunks).toBe(0);
  });

  it("deletes stale chunks then re-embeds when the hash changed", async () => {
    const { service, vectorStore, prisma } = makeService();
    const p = posting("greenhouse:acme:1");
    prisma.jobPosting.findUnique.mockResolvedValue({ contentHash: "stale-hash" });

    await service.indexPostings([p]);

    expect(vectorStore.delete).toHaveBeenCalledWith({
      filter: { postingId: "greenhouse:acme:1" },
    });
    expect(vectorStore.addDocuments).toHaveBeenCalledTimes(1);
  });

  it("embeds a new posting without a delete call", async () => {
    const { service, vectorStore } = makeService(); // findUnique -> null
    await service.indexPostings([posting("greenhouse:acme:2")]);
    expect(vectorStore.delete).not.toHaveBeenCalled();
    expect(vectorStore.addDocuments).toHaveBeenCalledTimes(1);
  });

  it("stores the new contentHash on upsert", async () => {
    const { service, prisma } = makeService();
    const p = posting("greenhouse:acme:1");
    await service.indexPostings([p]);
    const arg = prisma.jobPosting.upsert.mock.calls[0][0];
    expect(arg.create.contentHash).toBe(contentHash(p));
    expect(arg.update.contentHash).toBe(contentHash(p));
  });

  it("does not persist the contentHash when embedding fails, so the posting retries", async () => {
    // If the hash were written before addDocuments, a swallowed embed failure
    // would mark the posting "done" and skip it forever. The hash must be
    // persisted only after the embed succeeds.
    const { service, prisma, vectorStore } = makeService();
    vectorStore.addDocuments.mockRejectedValue(new Error("embed boom"));
    const p = posting("greenhouse:acme:err"); // new posting (findUnique -> null)

    const chunks = await service.indexPostings([p]);

    expect(vectorStore.addDocuments).toHaveBeenCalledTimes(1); // it was attempted
    expect(prisma.jobPosting.upsert).not.toHaveBeenCalled(); // ...but hash not written
    expect(chunks).toBe(0);
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
