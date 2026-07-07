import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import type { Embeddings } from "@langchain/core/embeddings";

/** Local ONNX embedding model. Dimension MUST equal the pgvector column dim. */
export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIM = 384;

let singleton: Embeddings | null = null;

/** Lazily-constructed shared embeddings instance (loads the model once). */
export function getEmbeddings(): Embeddings {
  if (!singleton) {
    singleton = new HuggingFaceTransformersEmbeddings({ model: EMBEDDING_MODEL });
  }
  return singleton;
}
