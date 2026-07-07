import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarketFitConsole } from "./market-fit-console";

afterEach(() => vi.restoreAllMocks());

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
}

describe("MarketFitConsole", () => {
  it("clicking a suggested chip fills the input", () => {
    render(<MarketFitConsole chips={["Which roles are remote?"]} />);
    fireEvent.click(screen.getByText("Which roles are remote?"));
    expect((screen.getByPlaceholderText(/ask/i) as HTMLInputElement).value).toBe(
      "Which roles are remote?",
    );
  });

  it("shows a retrieving indicator after submit, before the first answer token arrives", async () => {
    const resolvers: Array<() => void> = [];
    const metaGate = new Promise<void>((resolve) => {
      resolvers.push(resolve);
    });
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        await metaGate;
        controller.enqueue(new TextEncoder().encode('{"ok":true,"citations":[]}\n'));
        controller.enqueue(new TextEncoder().encode("Hello"));
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body }),
    );

    render(<MarketFitConsole chips={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/ask/i), {
      target: { value: "What roles are open?" },
    });
    fireEvent.click(screen.getByText("Ask"));

    await waitFor(() => expect(screen.getByText(/retrieving/i)).toBeInTheDocument());

    resolvers[0]?.();

    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument());
  });

  it("gather button streams /api/jobs/refresh lines into a progress log", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: streamOf(["starting…\n", "fetched 12 postings\n", "done\n"]),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MarketFitConsole chips={[]} />);
    fireEvent.click(screen.getByText(/gather latest/i));

    await waitFor(() => expect(screen.getByText(/fetched 12 postings/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/jobs/refresh", { method: "POST" });
  });

  it("shows the returned text when gather is rejected with 429/409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        body: null,
        text: () => Promise.resolve("Cooldown active, try again later"),
      }),
    );

    render(<MarketFitConsole chips={[]} />);
    fireEvent.click(screen.getByText(/gather latest/i));

    await waitFor(() =>
      expect(screen.getByText(/Cooldown active, try again later/)).toBeInTheDocument(),
    );
  });
});
