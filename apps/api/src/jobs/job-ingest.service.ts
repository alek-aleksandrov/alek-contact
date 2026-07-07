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
import {
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  MAX_POSTINGS,
} from "./companies.config";

type Deps = {
  prisma: PrismaService;
  fetchers?: {
    greenhouse: (c: string) => Promise<JobPosting[]>;
    lever: (c: string) => Promise<JobPosting[]>;
    hn: () => Promise<JobPosting[]>;
  };
  getStore?: () => Promise<{ addDocuments: (d: Document[]) => Promise<void> }>;
};

@Injectable()
export class JobIngestService implements OnModuleInit {
  private readonly log = new Logger(JobIngestService.name);
  private readonly prisma: PrismaService;
  private readonly fetchers: NonNullable<Deps["fetchers"]>;
  private readonly getStore: NonNullable<Deps["getStore"]>;
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  constructor(deps: Deps) {
    this.prisma = deps.prisma;
    this.fetchers = deps.fetchers ?? {
      greenhouse: (c) => fetchGreenhouse(c),
      lever: (c) => fetchLever(c),
      hn: () => fetchHnWhoIsHiring(),
    };
    this.getStore = deps.getStore ?? (() => getVectorStore());
  }

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.jobPosting.count();
    if (count === 0) {
      // Fire-and-forget so a slow/failing initial ingest never blocks or crashes
      // Nest bootstrap. The index simply populates once it completes.
      this.log.log("Job corpus empty; running initial ingest in background.");
      void this.ingest().catch((err) =>
        this.log.error("Initial ingest failed", err as Error),
      );
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async scheduledIngest(): Promise<void> {
    await this.ingest();
  }

  async collect(): Promise<JobPosting[]> {
    const groups = await Promise.all([
      ...GREENHOUSE_COMPANIES.map((c) => this.fetchers.greenhouse(c)),
      ...LEVER_COMPANIES.map((c) => this.fetchers.lever(c)),
      this.fetchers.hn(),
    ]);
    return dedupeById(roundRobin(groups)).slice(0, MAX_POSTINGS);
  }

  async indexPostings(
    postings: JobPosting[],
    onProgress: (line: string) => void = () => {},
  ): Promise<number> {
    const store = await this.getStore();
    let chunkCount = 0;
    let done = 0;
    for (const p of postings) {
      // Per-posting resilience: one bad posting (or a transient index error)
      // must not abort the whole ingest run.
      try {
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
          },
        });
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
        }
      } catch (err) {
        this.log.error(`Failed to index posting ${p.id}`, err as Error);
      } finally {
        done += 1;
        if (done % 25 === 0 || done === postings.length) {
          onProgress(`Indexed ${done}/${postings.length} postings…`);
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
