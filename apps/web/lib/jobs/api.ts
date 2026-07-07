import type { JobAskMeta } from "@repo/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Corpus size + last refresh, for the page disclosure. Never throws. */
export async function getJobAskMeta(): Promise<JobAskMeta> {
  try {
    // no-store: the corpus count changes as ingest/refresh run, and a stale
    // "0 postings" disclosure looks broken. The count query is cheap.
    const res = await fetch(`${API_URL}/api/jobs/meta`, { cache: "no-store" });
    if (!res.ok) return { count: 0, refreshedAt: null };
    return (await res.json()) as JobAskMeta;
  } catch {
    return { count: 0, refreshedAt: null };
  }
}
