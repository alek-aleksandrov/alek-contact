import type { JobPosting } from "@repo/shared";
import {
  isEngineeringRole,
  normalizeLever,
  type RawLeverJob,
} from "../job-normalize";

type Fetch = typeof fetch;

export async function fetchLever(
  company: string,
  fetchImpl: Fetch = fetch,
): Promise<JobPosting[]> {
  try {
    const res = await fetchImpl(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as RawLeverJob[];
    return (json ?? [])
      .filter((j) => isEngineeringRole(j.text))
      .map((j) => normalizeLever(company, j));
  } catch {
    return [];
  }
}
