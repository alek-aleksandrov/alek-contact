import type { JobPosting } from "@repo/shared";
import {
  isEngineeringRole,
  normalizeGreenhouse,
  type RawGreenhouseJob,
} from "../job-normalize";

type Fetch = typeof fetch;

export async function fetchGreenhouse(
  company: string,
  fetchImpl: Fetch = fetch,
): Promise<JobPosting[]> {
  try {
    const res = await fetchImpl(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { jobs?: RawGreenhouseJob[] };
    return (json.jobs ?? [])
      .filter((j) => isEngineeringRole(j.title))
      .map((j) => normalizeGreenhouse(company, j));
  } catch {
    return [];
  }
}
