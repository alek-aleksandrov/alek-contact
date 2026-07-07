import { describe, it, expect, vi } from "vitest";
import { fetchGreenhouse } from "./greenhouse.client";
import { fetchLever } from "./lever.client";
import { fetchHnWhoIsHiring } from "./hn.client";

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

describe("fetchGreenhouse", () => {
  it("returns normalized engineering postings", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        jobs: [
          {
            id: 1,
            title: "Senior Software Engineer",
            absolute_url: "https://boards.greenhouse.io/acme/jobs/1",
            location: { name: "Remote" },
            content: "Build things",
          },
          {
            id: 2,
            title: "Account Executive",
            absolute_url: "https://boards.greenhouse.io/acme/jobs/2",
            location: { name: "NY" },
            content: "Sell things",
          },
        ],
      }),
    );
    const out = await fetchGreenhouse("acme", fetchImpl);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("greenhouse:acme:1");
  });

  it("returns [] when the request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);
    expect(await fetchGreenhouse("acme", fetchImpl)).toEqual([]);
  });
});

describe("fetchLever", () => {
  it("returns normalized engineering postings", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: "a",
          text: "Staff ML Engineer",
          hostedUrl: "https://jobs.lever.co/beta/a",
          categories: { location: "SF" },
          descriptionPlain: "Models",
        },
      ]),
    );
    const out = await fetchLever("beta", fetchImpl);
    expect(out[0].id).toBe("lever:beta:a");
  });
});

describe("fetchHnWhoIsHiring", () => {
  it("resolves the latest whoishiring thread and parses its comments", async () => {
    const fetchImpl = vi
      .fn()
      // 1) user submitted list
      .mockResolvedValueOnce(jsonResponse({ submitted: [100, 99] }))
      // 2) item 100 = the thread (title contains 'Who is hiring')
      .mockResolvedValueOnce(
        jsonResponse({
          id: 100,
          title: "Ask HN: Who is hiring? (June 2026)",
          kids: [201, 202],
        }),
      )
      // 3) comment 201 (engineering) / 202 (noise)
      .mockResolvedValueOnce(
        jsonResponse({ id: 201, text: "Acme | Senior Software Engineer | Remote" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 202, text: "Beta | Sales | NY" }),
      );
    const out = await fetchHnWhoIsHiring(fetchImpl);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("hn:201");
  });
});

describe("error resilience (thrown)", () => {
  it("each client returns [] when fetch throws", async () => {
    const boom = vi.fn().mockRejectedValue(new Error("network down"));
    expect(await fetchGreenhouse("acme", boom)).toEqual([]);
    expect(await fetchLever("beta", boom)).toEqual([]);
    expect(await fetchHnWhoIsHiring(boom)).toEqual([]);
  });
});
