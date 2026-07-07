/** Where a posting came from. */
export type JobSource = "greenhouse" | "lever" | "hn";

/** Human-readable source labels for UI badges. */
export const SOURCE_LABELS: Record<JobSource, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  hn: "Hacker News",
};

/** A normalized job posting (the ingestion unit and the corpus record). */
export type JobPosting = {
  /** Stable id: `${source}:${externalId}`. */
  id: string;
  source: JobSource;
  company: string;
  title: string;
  location: string;
  url: string;
  /** ISO date string, or null when the source does not provide one. */
  postedAt: string | null;
  /** Plain-text posting body (HTML stripped). */
  body: string;
  /** Team/department, when the source exposes it. */
  department?: string;
  /** e.g. "Full-time". */
  commitment?: string;
  /** "Remote" | "Hybrid" | "Onsite", inferred/structured. */
  workplace?: string;
  /** Free-text salary/range when present. */
  salary?: string;
  /** Free-form tags (offices, categories, lists). */
  tags?: string[];
};

/** A posting cited in a RAG answer, with its retrieval similarity. */
export type JobCitation = {
  id: string;
  source: JobSource;
  company: string;
  title: string;
  url: string;
  /**
   * Retrieval score as `1 - distance` (cosine similarity); higher is closer.
   * Typically in [0,1], but can dip below 0 for dissimilar vectors.
   */
  score: number;
  workplace?: string;
  salary?: string;
  department?: string;
};

/** Corpus metadata shown in the page's disclosure line. */
export type JobAskMeta = {
  count: number;
  /** ISO timestamp of the most recent successful ingest, or null. */
  refreshedAt: string | null;
};
