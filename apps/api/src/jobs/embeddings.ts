import type { Embeddings } from "@langchain/core/embeddings";
import { WorkerEmbeddings } from "./worker-embeddings";

/** Local ONNX embedding model. Dimension MUST equal the pgvector column dim. */
export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIM = 384;

let singleton: Embeddings | null = null;

/**
 * Lazily-constructed shared embeddings instance. Inference runs on a worker
 * thread (see WorkerEmbeddings) so it never blocks the API event loop.
 */
export function getEmbeddings(): Embeddings {
  if (!singleton) {
    singleton = new WorkerEmbeddings();
  }
  return singleton;
}
