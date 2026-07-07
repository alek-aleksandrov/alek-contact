import { PGVectorStore, type DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import type { PoolConfig } from "pg";
import { getEmbeddings } from "./embeddings";

export const JOB_CHUNKS_TABLE = "job_chunks";

let store: PGVectorStore | null = null;

/** Shared PGVectorStore bound to the pre-created `job_chunks` table (cosine). */
export async function getVectorStore(): Promise<PGVectorStore> {
  if (store) return store;
  store = await PGVectorStore.initialize(getEmbeddings(), {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
    } as PoolConfig,
    tableName: JOB_CHUNKS_TABLE,
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    distanceStrategy: "cosine" as DistanceStrategy,
    // retrieve() treats the score as raw distance: similarity = 1 - distance
    scoreNormalization: "distance",
  });
  return store;
}
