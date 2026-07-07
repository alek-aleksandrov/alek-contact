import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./route";

afterEach(() => vi.restoreAllMocks());

describe("POST /api/jobs/refresh", () => {
  it("proxies the upstream Nest progress stream", async () => {
    const upstreamBody = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode("Fetching sources…\n"));
        c.enqueue(new TextEncoder().encode("Indexed 10 postings, 20 chunks.\n"));
        c.close();
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(upstreamBody, { status: 200 }),
    );
    const res = await POST();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).toContain("Fetching sources…");
    expect(text).toContain("Indexed 10 postings, 20 chunks.");
  });

  it("propagates a 429 cooldown response from upstream", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Refreshed recently; try again shortly.", { status: 429 }),
    );
    const res = await POST();
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("Refreshed recently");
  });

  it("propagates a 409 already-running response from upstream", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("A refresh is already running.", { status: 409 }),
    );
    const res = await POST();
    expect(res.status).toBe(409);
    expect(await res.text()).toContain("already running");
  });

  it("returns 502 when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST();
    expect(res.status).toBe(502);
  });
});
