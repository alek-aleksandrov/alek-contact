import type { JobPosting } from "@repo/shared";
import seed from "./data/postings.seed.json";

/** The committed, reproducible corpus. Bootstraps a fresh index and powers tests. */
export function loadSeedPostings(): JobPosting[] {
  return seed as JobPosting[];
}
