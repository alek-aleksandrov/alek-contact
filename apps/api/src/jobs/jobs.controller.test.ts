import { describe, it, expect, vi } from "vitest";
import { JobsController } from "./jobs.controller";

function mockRes() {
  const chunks: string[] = [];
  const res: {
    chunks: string[];
    statusCode: number | undefined;
    setHeader: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  } = {
    chunks,
    statusCode: undefined,
    setHeader: vi.fn(),
    write: vi.fn((s: string) => chunks.push(s)),
    end: vi.fn(),
    status: vi.fn(),
    send: vi.fn((s: string) => chunks.push(s)),
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res;
}

describe("JobsController.ask", () => {
  it("writes a JSON metadata frame then streams answer tokens", async () => {
    async function* toks() {
      yield "Hello ";
      yield "world";
    }
    const rag = {
      answer: vi.fn().mockResolvedValue({
        meta: { citations: [{ id: "greenhouse:acme:1" }], ok: true },
        stream: toks(),
      }),
    };
    const prisma = { jobPosting: { count: vi.fn() } };
    const ctrl = new JobsController(rag as any, prisma as any, {} as any, {} as any);
    const res = mockRes();
    await ctrl.ask({ question: "hi" }, res as any);

    expect(res.chunks[0]).toContain('"ok":true');
    expect(res.chunks.slice(1).join("")).toBe("Hello world");
    expect(res.end).toHaveBeenCalled();
  });

  it("ends the response and writes an error marker when the stream throws mid-iteration", async () => {
    async function* boom() {
      yield "partial";
      throw new Error("ASK backend unreachable");
    }
    const rag = {
      answer: vi.fn().mockResolvedValue({
        meta: { citations: [], ok: true },
        stream: boom(),
      }),
    };
    const prisma = { jobPosting: { count: vi.fn() } };
    const ctrl = new JobsController(rag as any, prisma as any, {} as any, {} as any);
    const res = mockRes();

    // Must resolve, not reject — the client would hang otherwise.
    await expect(ctrl.ask({ question: "hi" }, res as any)).resolves.toBeUndefined();

    expect(res.chunks[0]).toContain('"ok":true');
    expect(res.chunks.some((c) => c.includes("[error:"))).toBe(true);
    expect(res.end).toHaveBeenCalled();
  });
});

describe("JobsController.meta", () => {
  it("returns corpus count and latest refresh time", async () => {
    const prisma = {
      jobPosting: {
        count: vi.fn().mockResolvedValue(12),
        findFirst: vi.fn().mockResolvedValue({ indexedAt: new Date("2026-07-01") }),
      },
    };
    const ctrl = new JobsController({} as any, prisma as any, {} as any, {} as any);
    const meta = await ctrl.meta();
    expect(meta.count).toBe(12);
    expect(meta.refreshedAt).toBe(new Date("2026-07-01").toISOString());
  });
});

describe("JobsController.refresh", () => {
  it("streams progress on success", async () => {
    const ingest = {
      ingest: vi.fn(async (cb: (l: string) => void) => {
        cb("line1");
        cb("line2");
        return { postings: 2, chunks: 4 };
      }),
    };
    const guard = {
      run: vi.fn(async (fn: () => Promise<any>) => ({ ok: true, result: await fn() })),
    };
    const ctrl = new JobsController({} as any, { jobPosting: {} } as any, ingest as any, guard as any);
    const res = mockRes();
    await ctrl.refresh(res as any);
    expect(res.chunks.join("")).toContain("line1");
    expect(res.end).toHaveBeenCalled();
  });

  it("ends the response and writes an error marker when ingest throws mid-stream", async () => {
    const ingest = {
      ingest: vi.fn(async (cb: (l: string) => void) => {
        cb("line1");
        throw new Error("gather backend unreachable");
      }),
    };
    const guard = {
      run: vi.fn(async (fn: () => Promise<any>) => ({ ok: true, result: await fn() })),
    };
    const ctrl = new JobsController({} as any, {} as any, ingest as any, guard as any);
    const res = mockRes();

    // Must resolve, not reject — the client would hang otherwise.
    await expect(ctrl.refresh(res as any)).resolves.toBeUndefined();

    expect(res.chunks.join("")).toContain("line1");
    expect(res.chunks.some((c) => c.includes("[error:"))).toBe(true);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns 429 on cooldown", async () => {
    const guard = {
      run: vi.fn(async () => ({ ok: false, reason: "cooldown", retryAfterMs: 30000 })),
    };
    const ctrl = new JobsController({} as any, {} as any, { ingest: vi.fn() } as any, guard as any);
    const res = mockRes();
    await ctrl.refresh(res as any);
    expect(res.statusCode).toBe(429);
  });

  it("returns 409 when already running", async () => {
    const guard = {
      run: vi.fn(async () => ({ ok: false, reason: "running" })),
    };
    const ctrl = new JobsController({} as any, {} as any, { ingest: vi.fn() } as any, guard as any);
    const res = mockRes();
    await ctrl.refresh(res as any);
    expect(res.statusCode).toBe(409);
  });
});
