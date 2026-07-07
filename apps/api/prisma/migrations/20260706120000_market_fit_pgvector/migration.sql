-- Enable pgvector (Neon supports it).
CREATE EXTENSION IF NOT EXISTS vector;

-- JobPosting metadata table (managed by Prisma model).
CREATE TABLE IF NOT EXISTS "JobPosting" (
  "id"        TEXT PRIMARY KEY,
  "source"    TEXT NOT NULL,
  "company"   TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "location"  TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "postedAt"  TIMESTAMP(3),
  "body"      TEXT NOT NULL,
  "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "JobPosting_source_idx" ON "JobPosting" ("source");

-- Chunk-embeddings table used by LangChain PGVectorStore.
-- Dimension MUST match the embedding model (bge-small-en-v1.5 = 384).
CREATE TABLE IF NOT EXISTS "job_chunks" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "content"   TEXT,
  "metadata"  JSONB,
  "embedding" vector(384)
);
CREATE INDEX IF NOT EXISTS "job_chunks_embedding_idx"
  ON "job_chunks" USING hnsw ("embedding" vector_cosine_ops);
