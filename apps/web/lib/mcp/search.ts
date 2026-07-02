/**
 * Simple substring search over the profile content (highlights, skills,
 * projects). Case-insensitive, no external index — the dataset is tiny and
 * this keeps the endpoint keyless and dependency-free.
 */

import { experience, skills } from "@/content/experience";
import { projects } from "@/content/projects";

export type SearchHit = {
  /** Where the match came from, e.g. "Experience · Ninety" or "Skills · AI & Orchestration". */
  source: string;
  /** The matching line of text. */
  text: string;
};

/**
 * Return every highlight / skill / project line that contains `query`
 * (case-insensitive substring match).
 */
export function searchProfile(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];
  const matches = (text: string) => text.toLowerCase().includes(q);

  for (const job of experience) {
    const source = `Experience · ${job.company} (${job.role})`;
    if (matches(job.summary)) hits.push({ source, text: job.summary });
    for (const h of job.highlights) {
      if (matches(h)) hits.push({ source, text: h });
    }
    for (const t of job.tech) {
      if (matches(t)) hits.push({ source: `${source} · tech`, text: t });
    }
  }

  for (const group of skills) {
    for (const item of group.items) {
      if (matches(item)) {
        hits.push({ source: `Skills · ${group.group}`, text: item });
      }
    }
  }

  for (const project of projects) {
    const source = `Project · ${project.title}`;
    if (matches(project.title) || matches(project.tagline)) {
      hits.push({ source, text: `${project.title} — ${project.tagline}` });
    }
    if (matches(project.description)) {
      hits.push({ source, text: project.description });
    }
    for (const h of project.highlights ?? []) {
      if (matches(h)) hits.push({ source, text: h });
    }
    for (const s of project.stack) {
      if (matches(s)) hits.push({ source: `${source} · stack`, text: s });
    }
  }

  return hits;
}
