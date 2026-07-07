import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Document } from "@langchain/core/documents";
import type { JobPosting } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { fetchGreenhouse } from "./sources/greenhouse.client";
import { fetchLever } from "./sources/lever.client";
import { fetchHnWhoIsHiring } from "./sources/hn.client";
import { dedupeById, buildEmbedText } from "./job-normalize";
import { roundRobin } from "./job-collect";
import { loadSeedPostings } from "./seed";
import { getVectorStore } from "./vector-store";
import { contentHash } from "./content-hash";
import { RefreshGuard } from "./refresh-guard";
import {
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  MAX_POSTINGS,
} from "./companies.config";

type Store = {
  addDocuments: (docs: Document[]) => Promise<void>;
  delete: (params: { filter?: Record<string, unknown>; ids?: string[] }) => Promise<void>;
};

type Deps = {
  prisma: PrismaService;
  guard?: RefreshGuard;
  fetchers?: {
    greenhouse: (c: string) => Promise<JobPosting[]>;
    lever: (c: string) => Promise<JobPosting[]>;
    hn: () => Promise<JobPosting[]>;
  };
  getStore?: () => Promise<Store>;
};

@Injectable()
export class JobIngestService implements OnModuleInit {
  private readonly log = new Logger(JobIngestService.name);
  private readonly prisma: PrismaService;
  private readonly guard: RefreshGuard;
  private readonly fetchers: NonNullable<Deps["fetchers"]>;
  private readonly getStore: NonNullable<Deps["getStore"]>;
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  constructor(deps: Deps) {
    this.prisma = deps.prisma;
    this.guard =
      deps.guard ?? new RefreshGuard({ cooldownMs: 60_000, now: () => Date.now() });
    this.fetchers = deps.fetchers ?? {
      greenhouse: (c) => fetchGreenhouse(c),
      lever: (c) => fetchLever(c),
      hn: () => fetchHnWhoIsHiring(),
    };
    this.getStore =
      deps.getStore ?? (() => getVectorStore() as unknown as Promise<Store>);
  }

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.jobPosting.count();
    if (count === 0) {
      // Fire-and-forget so a slow/failing initial ingest never blocks or crashes
      // Nest bootstrap. runImmediate respects the shared lock (won't overlap a
      // manual refresh) but ignores the manual cooldown.
      this.log.log("Job corpus empty; running initial ingest in background.");
      void this.guard
        .runImmediate(() => this.ingest())
        .catch((err) => this.log.error("Initial ingest failed", err as Error));
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async scheduledIngest(): Promise<void> {
    await this.guard.runImmediate(() => this.ingest());
  }

  async collect(): Promise<JobPosting[]> {
    const groups = await Promise.all([
      ...GREENHOUSE_COMPANIES.map((c) => this.fetchers.greenhouse(c)),
      ...LEVER_COMPANIES.map((c) => this.fetchers.lever(c)),
      this.fetchers.hn(),
    ]);
    return dedupeById(roundRobin(groups)).slice(0, MAX_POSTINGS);
  }

  /** Upsert a posting's metadata row and its content hash. */
  private async upsertPosting(p: JobPosting, hash: string): Promise<void> {
    await this.prisma.jobPosting.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        source: p.source,
        company: p.company,
        title: p.title,
        location: p.location,
        url: p.url,
        postedAt: p.postedAt ? new Date(p.postedAt) : null,
        body: p.body,
        department: p.department ?? null,
        commitment: p.commitment ?? null,
        workplace: p.workplace ?? null,
        salary: p.salary ?? null,
        tags: p.tags ?? [],
        contentHash: hash,
      },
      update: {
        indexedAt: new Date(),
        body: p.body,
        title: p.title,
        department: p.department ?? null,
        commitment: p.commitment ?? null,
        workplace: p.workplace ?? null,
        salary: p.salary ?? null,
        tags: p.tags ?? [],
        contentHash: hash,
      },
    });
  }

  async indexPostings(
    postings: JobPosting[],
    onProgress: (line: string) => void = () => {},
  ): Promise<number> {
    const store = await this.getStore();
    let chunkCount = 0;
    let embedded = 0;
    let skipped = 0;
    let done = 0;
    for (const p of postings) {
      // Per-posting resilience: one bad posting (or a transient index error)
      // must not abort the whole ingest run.
      try {
        const hash = contentHash(p);
        const existing = await this.prisma.jobPosting.findUnique({
          where: { id: p.id },
          select: { contentHash: true },
        });
        const unchanged = existing != null && existing.contentHash === hash;

        if (unchanged) {
          // Chunks are already current; just refresh metadata + indexedAt.
          await this.upsertPosting(p, hash);
          skipped += 1;
        } else {
          // Changed posting: drop its old chunks first so we don't leave
          // orphaned vectors. New posting (existing == null) has none to drop.
          if (existing != null) {
            await store.delete({ filter: { postingId: p.id } });
          }
          const texts = await this.splitter.splitText(buildEmbedText(p));
          const docs: Document[] = texts.map((content) => ({
            pageContent: content,
            metadata: {
              postingId: p.id,
              source: p.source,
              company: p.company,
              title: p.title,
              url: p.url,
              workplace: p.workplace ?? null,
              salary: p.salary ?? null,
              department: p.department ?? null,
            },
          }));
          if (docs.length) {
            await store.addDocuments(docs);
            chunkCount += docs.length;
            embedded += 1;
          }
          // Persist the hash ONLY after embedding succeeds. If addDocuments
          // throws, the per-posting catch skips this write, so the next run
          // sees a hash mismatch and retries instead of marking the posting
          // done and dropping it from retrieval forever.
          await this.upsertPosting(p, hash);
        }
      } catch (err) {
        this.log.error(`Failed to index posting ${p.id}`, err as Error);
      } finally {
        done += 1;
        if (done % 25 === 0 || done === postings.length) {
          onProgress(
            `Indexed ${done}/${postings.length} (${embedded} embedded, ${skipped} unchanged)…`,
          );
        }
      }
    }
    return chunkCount;
  }

  async ingest(
    onProgress: (line: string) => void = () => {},
  ): Promise<{ postings: number; chunks: number }> {
    onProgress("Fetching sources…");
    let postings = await this.collect();
    if (postings.length === 0) {
      this.log.warn("All sources empty; using seed corpus.");
      onProgress("Sources empty; using seed corpus.");
      postings = loadSeedPostings();
    }
    onProgress(`Collected ${postings.length} postings; embedding…`);
    const chunks = await this.indexPostings(postings, onProgress);
    onProgress(`Indexed ${postings.length} postings, ${chunks} chunks.`);
    this.log.log(`Indexed ${postings.length} postings, ${chunks} chunks.`);
    return { postings: postings.length, chunks };
  }
}
