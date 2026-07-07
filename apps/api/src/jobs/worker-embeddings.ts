import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

/** Minimal surface of a worker we depend on (real Worker or a test fake). */
export interface WorkerLike {
  postMessage(msg: unknown): void;
  on(event: "message", cb: (msg: any) => void): unknown;
  on(event: "error", cb: (err: Error) => void): unknown;
  on(event: "exit", cb: (code: number) => void): unknown;
  terminate?(): Promise<number> | void;
}

export type WorkerReply =
  | { id: number; ok: true; vectors: number[][] }
  | { id: number; ok: false; error: string };

type Pending = { resolve: (v: number[][]) => void; reject: (e: Error) => void };

/**
 * LangChain Embeddings implementation that runs ONNX inference on a worker
 * thread instead of the main event loop. Bulk ingest embeds (addDocuments) and
 * query embeds (similaritySearch) both route here, so heavy CPU work never
 * blocks HTTP handling.
 */
export class WorkerEmbeddings extends Embeddings {
  private worker: WorkerLike | null = null;
  private seq = 0;
  private readonly pending = new Map<number, Pending>();
  private readonly createWorker: () => WorkerLike;

  constructor(opts: EmbeddingsParams & { createWorker?: () => WorkerLike } = {}) {
    super(opts);
    this.createWorker =
      opts.createWorker ??
      (() =>
        new Worker(join(__dirname, "embedding.worker.js")) as unknown as WorkerLike);
  }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    const w = this.createWorker();
    w.on("message", (msg: WorkerReply) => {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.vectors);
      else p.reject(new Error(msg.error));
    });
    const fail = (err: Error) => {
      for (const [, p] of this.pending) p.reject(err);
      this.pending.clear();
      this.worker = null; // next call respawns
    };
    w.on("error", fail);
    w.on("exit", (code) => {
      if (code !== 0) fail(new Error(`embedding worker exited with code ${code}`));
    });
    this.worker = w;
    return w;
  }

  private request(
    method: "embedDocuments" | "embedQuery",
    payload: string | string[],
  ): Promise<number[][]> {
    const w = this.ensureWorker();
    const id = ++this.seq;
    return new Promise<number[][]>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      w.postMessage({ id, method, payload });
    });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return this.request("embedDocuments", texts);
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.request("embedQuery", text);
    return vector;
  }
}
