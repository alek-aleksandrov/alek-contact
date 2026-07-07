import { describe, it, expect } from "vitest";
import { WorkerEmbeddings, type WorkerLike } from "./worker-embeddings";

// A fake worker: records postMessage calls and lets the test emit replies.
function fakeWorker() {
  const handlers: Record<string, Array<(m: any) => void>> = {};
  const w: WorkerLike & { emit: (ev: string, m: any) => void; posted: any[] } = {
    posted: [],
    postMessage(msg: unknown) {
      (w.posted as any[]).push(msg);
    },
    on(ev: string, cb: (m: any) => void) {
      (handlers[ev] ??= []).push(cb);
      return w as any;
    },
    emit(ev: string, m: any) {
      (handlers[ev] ?? []).forEach((f) => f(m));
    },
  };
  return w;
}

describe("WorkerEmbeddings", () => {
  it("correlates each reply to the right pending request", async () => {
    const w = fakeWorker();
    const emb = new WorkerEmbeddings({ createWorker: () => w });

    const p1 = emb.embedDocuments(["a"]);
    const p2 = emb.embedQuery("b");

    // Two messages posted, with distinct ids.
    expect(w.posted).toHaveLength(2);
    const [m1, m2] = w.posted;
    expect(m1.method).toBe("embedDocuments");
    expect(m2.method).toBe("embedQuery");

    // Reply out of order — id correlation must still resolve correctly.
    w.emit("message", { id: m2.id, ok: true, vectors: [[9, 9]] });
    w.emit("message", { id: m1.id, ok: true, vectors: [[1, 1]] });

    expect(await p1).toEqual([[1, 1]]);
    expect(await p2).toEqual([9, 9]); // embedQuery unwraps the single vector
  });

  it("rejects an error reply", async () => {
    const w = fakeWorker();
    const emb = new WorkerEmbeddings({ createWorker: () => w });
    const p = emb.embedDocuments(["a"]);
    w.emit("message", { id: w.posted[0].id, ok: false, error: "boom" });
    await expect(p).rejects.toThrow("boom");
  });

  it("rejects all pending promises when the worker errors", async () => {
    const w = fakeWorker();
    const emb = new WorkerEmbeddings({ createWorker: () => w });
    const p = emb.embedDocuments(["a"]);
    w.emit("error", new Error("worker died"));
    await expect(p).rejects.toThrow("worker died");
  });

  it("returns [] for an empty document list without posting a message", async () => {
    const w = fakeWorker();
    const emb = new WorkerEmbeddings({ createWorker: () => w });
    expect(await emb.embedDocuments([])).toEqual([]);
    expect(w.posted).toHaveLength(0);
  });
});
