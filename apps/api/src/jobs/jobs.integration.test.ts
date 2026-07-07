import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JobsModule } from "./jobs.module";
import { JobRagService } from "./job-rag.service";
import { JobIngestService } from "./job-ingest.service";
import { RefreshGuard } from "./refresh-guard";
import { PrismaService } from "../prisma/prisma.service";

// Boots the JobsModule through Nest's real DI container + HTTP layer
// (Test.createTestingModule -> app.init()), mirroring main.ts's
// app.setGlobalPrefix("api"). This is what actually catches:
//  - the DI-provider bug (bare `providers: [JobRagService]` made Nest try to
//    inject its `Deps = {}` constructor param and throw
//    UnknownDependenciesException at boot -- a unit test that does
//    `new JobRagService()` directly never exercises Nest's container at all)
//  - the route double-prefix bug (`@Controller("api/jobs")` + the global
//    `api` prefix mounted routes at /api/api/jobs instead of /api/jobs)
//
// JobRagService and JobIngestService are registered via factory providers
// (`{ provide: JobRagService, useFactory: () => new JobRagService() }`), so
// they're overridden with `.overrideProvider(...).useValue(...)` rather than
// `.overrideProvider(...).useFactory(...)` -- useValue fully replaces the
// provider (including the factory), so the real ChatOpenAI client / vector
// store / initial ingest network calls never construct. The module still has
// to *compile* with the real factory-provider registrations in
// jobs.module.ts, so the DI-provider fix is exercised regardless.
describe("JobsModule (HTTP boot integration)", () => {
  let app: INestApplication;

  const fakeRag = {
    answer: vi.fn().mockResolvedValue({
      meta: { citations: [], ok: true },
      stream: (async function* () {
        yield "fake ";
        yield "answer";
      })(),
    }),
  };

  const fakeIngest = {
    // Real JobIngestService.onModuleInit fires a background ingest
    // (network fetches + vector store + Prisma writes) when the corpus is
    // empty. The fake must be a no-op so app.init() never touches those.
    onModuleInit: vi.fn().mockResolvedValue(undefined),
    // Used by POST /api/jobs/refresh below. Emits one progress line then
    // holds briefly, so a concurrent second request lands mid-flight and
    // observes the RefreshGuard's "running" state (-> 409).
    ingest: vi.fn(async (cb: (line: string) => void) => {
      cb("Indexed 1 posting, 1 chunk.");
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { postings: 1, chunks: 1 };
    }),
  };

  const fakePrisma = {
    jobPosting: {
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    // PrismaService normally implements OnModuleInit/OnModuleDestroy and
    // calls $connect()/$disconnect(). Omitting those methods here means Nest
    // finds no lifecycle hook on the override and skips it -- no real DB
    // connection is attempted.
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JobsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .overrideProvider(JobRagService)
      .useValue(fakeRag)
      .overrideProvider(JobIngestService)
      .useValue(fakeIngest)
      .overrideProvider(RefreshGuard)
      .useValue(new RefreshGuard({ cooldownMs: 0, now: () => Date.now() }))
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/jobs/meta returns 200 with count and refreshedAt", async () => {
    const res = await request(app.getHttpServer()).get("/api/jobs/meta");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 0, refreshedAt: null });
    expect(fakePrisma.jobPosting.count).toHaveBeenCalled();
  });

  it("GET /api/api/jobs/meta 404s (proves the double-prefix bug is gone)", async () => {
    const res = await request(app.getHttpServer()).get("/api/api/jobs/meta");
    expect(res.status).toBe(404);
  });

  it("POST /api/jobs/ask streams a JSON metadata line followed by tokens", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/jobs/ask")
      .send({ question: "hi" });

    expect(res.status).toBe(200);
    const [firstLine, ...rest] = res.text.split("\n");
    expect(JSON.parse(firstLine)).toEqual({ citations: [], ok: true });
    expect(rest.join("\n")).toBe("fake answer");
    expect(fakeRag.answer).toHaveBeenCalledWith("hi");
  });

  it("POST /api/jobs/refresh streams progress and blocks a concurrent call with 409", async () => {
    // supertest's Test object (a superagent Request) only actually sends
    // once something calls `.then()`/awaits it, so both requests are wired
    // up inside a single Promise.all: the first is awaited immediately
    // (sending right away), the second is delayed a few ms behind an async
    // IIFE so it reliably lands while the first is still mid-flight and
    // holding the RefreshGuard.
    const [firstRes, secondRes] = await Promise.all([
      request(app.getHttpServer()).post("/api/jobs/refresh"),
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return request(app.getHttpServer()).post("/api/jobs/refresh");
      })(),
    ]);

    expect(secondRes.status).toBe(409);
    expect(firstRes.status).toBe(200);
    expect(firstRes.text).toContain("Indexed 1 posting, 1 chunk.");
  });
});
