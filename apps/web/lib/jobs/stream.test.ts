import { describe, it, expect } from "vitest";
import { JobAskStreamParser } from "./stream";

describe("JobAskStreamParser", () => {
  it("parses a metadata frame and answer tokens delivered in one chunk", () => {
    const parser = new JobAskStreamParser();
    const delta = parser.feed('{"ok":true,"citations":[]}\nHello world');

    expect(parser.meta).toEqual({ ok: true, citations: [] });
    expect(parser.answer).toBe("Hello world");
    expect(delta).toBe("Hello world");
  });

  it("parses a metadata frame whose newline is split across chunk boundaries", () => {
    const parser = new JobAskStreamParser();

    const delta1 = parser.feed('{"ok":true,"cita');
    // Nothing to report yet: no newline seen, so no meta and no answer text.
    expect(parser.meta).toBeNull();
    expect(parser.answer).toBe("");
    expect(delta1).toBe("");

    const delta2 = parser.feed('tions":[]}\nHello');
    expect(parser.meta).toEqual({ ok: true, citations: [] });
    expect(parser.answer).toBe("Hello");
    expect(delta2).toBe("Hello");
  });

  it("accumulates answer tokens arriving across multiple chunks after the frame", () => {
    const parser = new JobAskStreamParser();

    parser.feed('{"ok":true,"citations":[]}\n');
    const d1 = parser.feed("Hel");
    const d2 = parser.feed("lo ");
    const d3 = parser.feed("world");

    expect(d1).toBe("Hel");
    expect(d2).toBe("lo ");
    expect(d3).toBe("world");
    expect(parser.answer).toBe("Hello world");
  });

  it("does not treat a newline inside the answer as a second metadata frame", () => {
    const parser = new JobAskStreamParser();
    const delta = parser.feed(
      '{"ok":true,"citations":[]}\nLine one\nLine two',
    );

    // Metadata is parsed exactly once, from the first line only.
    expect(parser.meta).toEqual({ ok: true, citations: [] });
    // Embedded newline is preserved in the answer, not consumed as a frame.
    expect(parser.answer).toBe("Line one\nLine two");
    expect(delta).toBe("Line one\nLine two");
  });

  it("preserves embedded answer newlines even when split across chunks", () => {
    const parser = new JobAskStreamParser();
    parser.feed('{"ok":true,"citations":[]}\nLine one');
    parser.feed("\nLine two");

    expect(parser.meta).toEqual({ ok: true, citations: [] });
    expect(parser.answer).toBe("Line one\nLine two");
  });

  it("populates citations from the metadata frame", () => {
    const parser = new JobAskStreamParser();
    parser.feed(
      '{"ok":true,"citations":[{"id":"greenhouse:acme:1","source":"greenhouse","company":"Acme","title":"Engineer","url":"https://x/1","score":0.8}]}\nAnswer',
    );

    expect(parser.meta?.citations).toHaveLength(1);
    expect(parser.meta?.citations[0]?.company).toBe("Acme");
    expect(parser.answer).toBe("Answer");
  });

  it("ignores a malformed metadata line rather than throwing", () => {
    const parser = new JobAskStreamParser();
    expect(() => parser.feed("not json at all\nrest of text")).not.toThrow();
    expect(parser.meta).toBeNull();
    expect(parser.answer).toBe("rest of text");
  });
});
