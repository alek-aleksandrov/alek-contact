import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { JobCitation, JobSource } from "@repo/shared";
import { getVectorStore } from "./vector-store";

/** How many chunks to pull from the vector store before diversifying. */
export const CANDIDATE_K = 30;
/** How many postings to surface as citations. */
export const RETRIEVAL_K = 6;
/** Cap postings per company in the results, so one company can't dominate. */
export const MAX_PER_COMPANY = 2;
/** Minimum cosine similarity (1 - distance) for a chunk to count as on-topic. */
export const MIN_SCORE = 0.25;

type Store = {
  similaritySearchWithScore: (
    q: string,
    k: number,
  ) => Promise<Array<[{ pageContent: string; metadata: Record<string, any> }, number]>>;
};

type Deps = { getStore?: () => Promise<Store>; chat?: ChatOpenAI };

@Injectable()
export class JobRagService {
  private readonly getStore: () => Promise<Store>;
  private readonly chat: ChatOpenAI;

  constructor(deps: Deps = {}) {
    this.getStore = deps.getStore ?? (() => getVectorStore() as unknown as Promise<Store>);
    this.chat =
      deps.chat ??
      new ChatOpenAI({
        model: process.env.ASK_MODEL ?? "gpt-oss:20b",
        apiKey: process.env.ASK_API_KEY,
        temperature: 0.2,
        maxTokens: 512,
        useResponsesApi: false,
        configuration: { baseURL: process.env.ASK_BASE_URL },
      });
  }

  async retrieve(
    question: string,
  ): Promise<{ citations: JobCitation[]; context: string; ok: boolean }> {
    const store = await this.getStore();
    const pairs = await store.similaritySearchWithScore(question, CANDIDATE_K);
    const scored = pairs
      .map(([docu, distance]) => ({ docu, score: 1 - distance }))
      .filter((x) => x.score >= MIN_SCORE);

    if (scored.length === 0) return { citations: [], context: "", ok: false };

    // Keep the best chunk per posting (scored is distance-ascending, so the
    // first time we see a posting is its best chunk).
    const bestByPosting = new Map<string, (typeof scored)[number]>();
    for (const s of scored) {
      const id = String(s.docu.metadata.postingId);
      if (!bestByPosting.has(id)) bestByPosting.set(id, s);
    }

    // Greedily select top postings, capping per company so one company can't
    // dominate the results, up to RETRIEVAL_K.
    const perCompany = new Map<string, number>();
    const seenTitles = new Set<string>();
    const selected: (typeof scored)[number][] = [];
    for (const s of bestByPosting.values()) {
      const company = String(s.docu.metadata.company);
      // Collapse near-duplicate postings: the same role posted to several
      // locations shows up as separate Greenhouse jobs (distinct ids).
      const titleKey = `${company}|${String(s.docu.metadata.title).toLowerCase()}`;
      if (seenTitles.has(titleKey)) continue;
      const used = perCompany.get(company) ?? 0;
      if (used >= MAX_PER_COMPANY) continue;
      seenTitles.add(titleKey);
      perCompany.set(company, used + 1);
      selected.push(s);
      if (selected.length >= RETRIEVAL_K) break;
    }

    const citations: JobCitation[] = selected.map(({ docu, score }) => ({
      id: String(docu.metadata.postingId),
      source: docu.metadata.source as JobSource,
      company: String(docu.metadata.company),
      title: String(docu.metadata.title),
      url: String(docu.metadata.url),
      score: Number(score.toFixed(3)),
      workplace: docu.metadata.workplace ?? undefined,
      salary: docu.metadata.salary ?? undefined,
      department: docu.metadata.department ?? undefined,
    }));
    const context = selected
      .map(
        ({ docu }) =>
          `[${docu.metadata.company} — ${docu.metadata.title}]\n${docu.pageContent}`,
      )
      .join("\n\n");
    return { citations, context, ok: true };
  }

  buildMessages(question: string, context: string): BaseMessage[] {
    return [
      new SystemMessage(
        "You answer questions about the current engineering job market using ONLY the " +
          "job postings provided as context. Cite companies by name. If the context does " +
          "not support an answer, say so plainly. Be concise and concrete.",
      ),
      new HumanMessage(`Context (job postings):\n${context}\n\nQuestion: ${question}`),
    ];
  }

  async answer(
    question: string,
  ): Promise<{ meta: { citations: JobCitation[]; ok: boolean }; stream: AsyncIterable<string> }> {
    const { citations, context, ok } = await this.retrieve(question);
    if (!ok) {
      async function* none(): AsyncIterable<string> {
        yield "I don't have any job postings that cover that. Try asking about roles, skills, or companies.";
      }
      return { meta: { citations, ok }, stream: none() };
    }
    const messages = this.buildMessages(question, context);
    const chat = this.chat;
    async function* tokens(): AsyncIterable<string> {
      const stream = await chat.stream(messages);
      for await (const chunk of stream) {
        const text = typeof chunk.content === "string" ? chunk.content : "";
        if (text) yield text;
      }
    }
    return { meta: { citations, ok }, stream: tokens() };
  }
}
