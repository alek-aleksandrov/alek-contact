import type { JobPosting } from "@repo/shared";
import { isEngineeringRole, normalizeHn, type RawHnPosting } from "../job-normalize";
import { HN_WHOISHIRING_USER, HN_MAX_COMMENTS } from "../companies.config";

type Fetch = typeof fetch;
const HN = "https://hacker-news.firebaseio.com/v0";

async function getItem(id: number, fetchImpl: Fetch): Promise<any | null> {
  const res = await fetchImpl(`${HN}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchHnWhoIsHiring(
  fetchImpl: Fetch = fetch,
): Promise<JobPosting[]> {
  try {
    const userRes = await fetchImpl(`${HN}/user/${HN_WHOISHIRING_USER}.json`);
    if (!userRes.ok) return [];
    const user = (await userRes.json()) as { submitted?: number[] };
    const submitted = user.submitted ?? [];

    // Find the newest submission whose title is a "Who is hiring" thread.
    let thread: { kids?: number[] } | null = null;
    for (const id of submitted.slice(0, 10)) {
      const item = await getItem(id, fetchImpl);
      if (item?.title && /who is hiring/i.test(item.title)) {
        thread = item;
        break;
      }
    }
    if (!thread?.kids) return [];

    const out: JobPosting[] = [];
    for (const kid of thread.kids.slice(0, HN_MAX_COMMENTS)) {
      const comment = (await getItem(kid, fetchImpl)) as RawHnPosting | null;
      if (!comment) continue;
      const posting = normalizeHn(comment);
      if (posting && isEngineeringRole(posting.title)) out.push(posting);
    }
    return out;
  } catch {
    return [];
  }
}
