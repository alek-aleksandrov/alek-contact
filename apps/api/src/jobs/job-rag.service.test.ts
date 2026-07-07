import { describe, it, expect, vi } from "vitest";
import { JobRagService } from "./job-rag.service";

function fakeStore(pairs: Array<[any, number]>) {
  return { similaritySearchWithScore: vi.fn().mockResolvedValue(pairs) };
}

const doc = (postingId: string, content: string) => ({
  pageContent: content,
  metadata: {
    postingId,
    source: "greenhouse",
    company: "Acme",
    title: "Senior Software Engineer",
    url: "https://x/1",
  } as any,
});

describe("JobRagService.retrieve", () => {
  it("returns citations + context when a chunk clears the score floor", async () => {
    const store = fakeStore([[doc("greenhouse:acme:1", "Go backend"), 0.1]]); // low distance
    const svc = new JobRagService({ getStore: async () => store as any, chat: {} as any });
    const r = await svc.retrieve("who wants Go engineers?");
    expect(r.ok).toBe(true);
    expect(r.citations[0].id).toBe("greenhouse:acme:1");
    expect(r.context).toContain("Go backend");
  });

  it("reports not-ok when everything is below the score floor", async () => {
    const store = fakeStore([[doc("greenhouse:acme:1", "irrelevant"), 0.99]]);
    const svc = new JobRagService({ getStore: async () => store as any, chat: {} as any });
    const r = await svc.retrieve("quantum basket weaving");
    expect(r.ok).toBe(false);
    expect(r.citations).toHaveLength(0);
  });

  it("surfaces rich fields on citations", async () => {
    const d = doc("greenhouse:acme:1", "Go backend");
    d.metadata.workplace = "Remote";
    d.metadata.salary = "$200k";
    d.metadata.department = "Platform";
    const store = { similaritySearchWithScore: vi.fn().mockResolvedValue([[d, 0.1]]) };
    const svc = new JobRagService({ getStore: async () => store as any, chat: {} as any });
    const r = await svc.retrieve("go?");
    expect(r.citations[0].workplace).toBe("Remote");
    expect(r.citations[0].salary).toBe("$200k");
    expect(r.citations[0].department).toBe("Platform");
  });

  const mk = (id: string, company: string, title: string) => ({
    pageContent: "platform engineering role",
    metadata: { postingId: id, source: "greenhouse", company, title, url: "https://x/" + id },
  });

  it("caps postings per company so one company cannot dominate", async () => {
    // Distinct titles so the cap (not title-dedup) is what limits Acme.
    const store = fakeStore([
      [mk("a1", "Acme", "Platform Engineer I"), 0.05],
      [mk("a2", "Acme", "Platform Engineer II"), 0.06],
      [mk("a3", "Acme", "Platform Engineer III"), 0.07],
      [mk("a4", "Acme", "Platform Engineer IV"), 0.08],
      [mk("b1", "Beta", "Infra Engineer"), 0.09],
    ]);
    const svc = new JobRagService({ getStore: async () => store as any, chat: {} as any });
    const r = await svc.retrieve("platform engineers");
    expect(r.citations.filter((c) => c.company === "Acme").length).toBe(2);
    expect(r.citations.some((c) => c.company === "Beta")).toBe(true);
  });

  it("collapses near-duplicate postings (same company + title)", async () => {
    const store = fakeStore([
      [mk("d1", "Dropbox", "Senior Infra Engineer"), 0.05],
      [mk("d2", "Dropbox", "Senior Infra Engineer"), 0.06], // same role, other location
    ]);
    const svc = new JobRagService({ getStore: async () => store as any, chat: {} as any });
    const r = await svc.retrieve("infra");
    expect(r.citations).toHaveLength(1);
  });
});

describe("JobRagService.buildMessages", () => {
  it("puts the context and question into the prompt", () => {
    const svc = new JobRagService({ getStore: async () => ({}) as any, chat: {} as any });
    const msgs = svc.buildMessages("What pays most?", "CTX");
    const text = msgs.map((m) => String(m.content)).join("\n");
    expect(text).toContain("CTX");
    expect(text).toContain("What pays most?");
  });
});

async function drain(stream: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const t of stream) out += t;
  return out;
}

describe("JobRagService.answer", () => {
  it("streams an honest fallback and empty meta when nothing clears the floor", async () => {
    const store = fakeStore([[doc("greenhouse:acme:1", "irrelevant"), 0.99]]);
    const chat = { stream: vi.fn() };
    const svc = new JobRagService({ getStore: async () => store as any, chat: chat as any });

    const { meta, stream } = await svc.answer("quantum basket weaving");
    const text = await drain(stream);

    expect(meta.ok).toBe(false);
    expect(meta.citations).toHaveLength(0);
    expect(text).toContain("cover that");
    expect(chat.stream).not.toHaveBeenCalled(); // no LLM call on the fallback path
  });

  it("streams model tokens and non-empty meta when a chunk clears the floor", async () => {
    const store = fakeStore([[doc("greenhouse:acme:1", "Go backend"), 0.1]]);
    const chat = {
      stream: vi.fn().mockResolvedValue(
        (async function* () {
          yield { content: "Hel" };
          yield { content: "lo" };
        })(),
      ),
    };
    const svc = new JobRagService({ getStore: async () => store as any, chat: chat as any });

    const { meta, stream } = await svc.answer("who wants Go engineers?");
    const text = await drain(stream);

    expect(meta.ok).toBe(true);
    expect(meta.citations).not.toHaveLength(0);
    expect(meta.citations[0].id).toBe("greenhouse:acme:1");
    expect(text).toBe("Hello");
    expect(chat.stream).toHaveBeenCalledTimes(1);
  });
});
