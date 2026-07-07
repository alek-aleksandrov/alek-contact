import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./route";

afterEach(() => vi.restoreAllMocks());

describe("POST /api/ask-jobs", () => {
  it("proxies the upstream Nest stream", async () => {
    const upstreamBody = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('{"ok":true}\n'));
        c.enqueue(new TextEncoder().encode("Answer text"));
        c.close();
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(upstreamBody, { status: 200 }),
    );
    const req = new Request("http://localhost/api/ask-jobs", {
      method: "POST",
      body: JSON.stringify({ question: "hi" }),
    });
    const res = await POST(req);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).toContain('"ok":true');
    expect(text).toContain("Answer text");
  });

  it("returns 502 when upstream fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    const req = new Request("http://localhost/api/ask-jobs", {
      method: "POST",
      body: JSON.stringify({ question: "hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("returns 502 when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const req = new Request("http://localhost/api/ask-jobs", {
      method: "POST",
      body: JSON.stringify({ question: "hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("returns 400 when the request body is malformed", async () => {
    const req = new Request("http://localhost/api/ask-jobs", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
