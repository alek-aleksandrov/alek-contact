import type { JobPosting } from "@repo/shared";

/** Interleave items across groups (one per group per round), preserving order within a group. */
export function roundRobin(groups: JobPosting[][]): JobPosting[] {
  const out: JobPosting[] = [];
  const max = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < max; i++) {
    for (const g of groups) {
      if (i < g.length) out.push(g[i]);
    }
  }
  return out;
}
