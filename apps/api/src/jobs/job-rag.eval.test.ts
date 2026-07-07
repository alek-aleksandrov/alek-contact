import { describe, it, expect, beforeAll } from "vitest";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { loadSeedPostings } from "./seed";
import { getEmbeddings } from "./embeddings";

// Golden questions -> the seed posting id expected in the top-K.
// One entry per seed posting in postings.seed.json, grounded in that
// posting's own distinctive vocabulary.
const GOLDEN: Array<{ q: string; expectId: string }> = [
  {
    q: "Which company needs an engineer to reconcile double-entry ledgers and harden payment state machines for card network and ACH settlement?",
    expectId: "greenhouse:stripe:1000001",
  },
  {
    q: "Who is hiring for a role maintaining a React design system with design tokens, a Storybook documentation site, and a Figma-to-code pipeline?",
    expectId: "greenhouse:airbnb:1000002",
  },
  {
    q: "Which company wants an AI engineer to fine-tune vision-language models and build RAG pipelines for generative design-asset retrieval?",
    expectId: "greenhouse:figma:1000003",
  },
  {
    q: "Who needs a data engineer to build Spark and Airflow pipelines for petabyte-scale Delta Lake tables stored as Parquet?",
    expectId: "greenhouse:databricks:1000004",
  },
  {
    q: "Which company is hiring an SRE to run GPU-aware Kubernetes autoscaling for model inference clusters with Terraform and Prometheus observability?",
    expectId: "greenhouse:anthropic:1000005",
  },
  {
    q: "Who wants a security engineer to build SAST and DAST scanning pipelines and lead zero-trust secrets management with Vault?",
    expectId: "lever:gitlab:1000006",
  },
  {
    q: "Which company needs an engineer to improve the CLI, build-cache, and incremental-build performance for its developer platform?",
    expectId: "lever:netlify:1000007",
  },
  {
    q: "Who is hiring a full-stack engineer to build a drag-and-drop visual editor with WebSocket real-time collaboration and a GraphQL API?",
    expectId: "lever:voiceflow:1000008",
  },
  {
    q: "Which company needs an iOS engineer to fix offline-sync conflict resolution and cold-start time in a Swift and SwiftUI app?",
    expectId: "hn:41000009",
  },
  {
    q: "Who is hiring a principal engineer for bare-metal provisioning and BGP anycast routing automation across edge data centers?",
    expectId: "hn:41000010",
  },
];

const TOP_K = 3;

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

describe("retrieval eval over the seed corpus", () => {
  const embeddings = getEmbeddings();
  let chunks: { postingId: string; vec: number[] }[] = [];

  beforeAll(async () => {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 100 });
    const texts: string[] = [];
    const ids: string[] = [];
    for (const p of loadSeedPostings()) {
      for (const t of await splitter.splitText(p.body)) {
        texts.push(t);
        ids.push(p.id);
      }
    }
    const vecs = await embeddings.embedDocuments(texts);
    chunks = vecs.map((vec, i) => ({ postingId: ids[i], vec }));
  }, 300_000); // model download + embedding; generous timeout

  for (const { q, expectId } of GOLDEN) {
    it(
      `retrieves ${expectId} for: ${q}`,
      async () => {
        const qvec = await embeddings.embedQuery(q);
        const ranked = chunks
          .map((c) => ({ id: c.postingId, score: cosine(qvec, c.vec) }))
          .sort((a, b) => b.score - a.score);
        const topIds = [...new Set(ranked.map((r) => r.id))].slice(0, TOP_K); // distinct postings, best-first
        expect(topIds).toContain(expectId);
      },
      60_000,
    );
  }
});
