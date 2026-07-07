import type { JobCitation } from "@repo/shared";

/** The leading metadata frame the `/api/ask-jobs` proxy writes before the answer tokens. */
export type JobAskMetaFrame = {
  ok: boolean;
  citations: JobCitation[];
};

/**
 * Incrementally splits a `/api/ask-jobs` response stream into its leading JSON
 * metadata line (`{ok, citations}\n`) and the answer tokens that follow.
 *
 * The upstream write can flush at any byte boundary, so the newline that ends
 * the metadata frame — or the frame's JSON itself — may be split across two
 * (or more) decoded chunks. Feed each chunk in order; state accumulates
 * across calls until the newline is seen, then every byte after it is answer
 * text.
 */
export class JobAskStreamParser {
  private buffer = "";
  private metaSeen = false;

  /** Parsed metadata frame, once seen. `null` before that, or if the frame was malformed. */
  meta: JobAskMetaFrame | null = null;

  /** Answer text accumulated so far (everything after the metadata line). */
  answer = "";

  /**
   * Feed the next decoded chunk. Returns the answer-text delta produced by
   * this call (empty string if this chunk only contributed to the metadata
   * line, or completed it with nothing left over).
   */
  feed(chunk: string): string {
    this.buffer += chunk;

    if (!this.metaSeen) {
      const nl = this.buffer.indexOf("\n");
      if (nl === -1) return "";

      const metaLine = this.buffer.slice(0, nl);
      this.buffer = this.buffer.slice(nl + 1);
      this.metaSeen = true;
      try {
        this.meta = JSON.parse(metaLine) as JobAskMetaFrame;
      } catch {
        this.meta = null;
      }
    }

    if (!this.buffer) return "";
    const delta = this.buffer;
    this.answer += delta;
    this.buffer = "";
    return delta;
  }
}
