import type { JobPosting } from "@repo/shared";
import { inferWorkplace } from "./companies.config";

/** Minimal HTML → text: drop tags, decode a few common entities, collapse ws. */
export function stripHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;|&#x27;/gi, "'").replace(/&#x2f;/gi, "/")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;|&#8217;|&lsquo;|&#8216;/g, "'")
    .replace(/&rdquo;|&#8221;|&ldquo;|&#8220;/g, '"')
    .replace(/&mdash;|&#8212;|&ndash;|&#8211;/g, "-")
    .replace(/&hellip;|&#8230;/g, "...")
    .replace(/<\/?(?:p|div|span|b|i|strong|em|h[1-6]|a|br|hr|ul|ol|li|table|tr|td|th|tbody|thead|tfoot|form|input|select|textarea|button|blockquote|pre|code|script|style|noscript|iframe|img|source|track|video|audio|canvas|svg|article|aside|nav|section|header|footer|main|figure|figcaption)\s*[^>]*>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ENGINEERING = /(engineer|developer|programmer|architect|sre|devops)/i;
const SENIORITY = /\b(senior|staff|principal|lead|sr\.?|ai|ml)\b|machine learning/i;

/** Keep senior/AI-leaning engineering roles; drop everything else. */
export function isEngineeringRole(title: string): boolean {
  return ENGINEERING.test(title) && SENIORITY.test(title);
}

/** Keep the first posting for each id (stable order). */
export function dedupeById(postings: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  const out: JobPosting[] = [];
  for (const p of postings) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type RawGreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  company_name?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string }>;
  metadata?: Array<{ name?: string; value?: unknown }>;
  content: string; // HTML-escaped HTML
  updated_at?: string;
};

/** Scan Greenhouse metadata for a salary-like entry (best-effort; usually absent). */
function greenhouseSalary(job: RawGreenhouseJob): string | undefined {
  const hit = (job.metadata ?? []).find((m) =>
    /salary|compensation|pay/i.test(m.name ?? ""),
  );
  const v = hit?.value;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function normalizeGreenhouse(
  company: string,
  job: RawGreenhouseJob,
): JobPosting {
  const location = job.location?.name ?? "Unspecified";
  const department = job.departments?.[0]?.name || undefined;
  const tags = [
    ...(job.departments ?? []).map((d) => d.name),
    ...(job.offices ?? []).map((o) => o.name),
  ].filter((t): t is string => !!t);
  return {
    id: `greenhouse:${company}:${job.id}`,
    source: "greenhouse",
    company: job.company_name?.trim() || company,
    title: job.title,
    location,
    url: job.absolute_url,
    postedAt: job.updated_at ? new Date(job.updated_at).toISOString() : null,
    body: stripHtml(job.content),
    department,
    workplace: inferWorkplace(location) ?? undefined,
    salary: greenhouseSalary(job),
    tags: tags.length ? tags : undefined,
  };
}

export type RawLeverJob = {
  id: string;
  text: string; // title
  hostedUrl: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
    department?: string;
  };
  workplaceType?: string; // "remote" | "hybrid" | "on-site"
  salaryRange?: { min?: number; max?: number; currency?: string };
  descriptionPlain?: string;
  description?: string; // HTML fallback
  createdAt?: number; // epoch ms
};

function leverWorkplace(t?: string): string | undefined {
  if (!t) return undefined;
  const l = t.toLowerCase();
  if (l.includes("hybrid")) return "Hybrid";
  if (l.includes("remote")) return "Remote";
  return "Onsite";
}

function leverSalary(r?: RawLeverJob["salaryRange"]): string | undefined {
  if (!r?.min && !r?.max) return undefined;
  const fmt = (n?: number) => (n ? `${Math.round(n / 1000)}k` : "?");
  return `$${fmt(r.min)}–$${fmt(r.max)}`;
}

export function normalizeLever(company: string, job: RawLeverJob): JobPosting {
  const body = job.descriptionPlain ?? stripHtml(job.description ?? "");
  return {
    id: `lever:${company}:${job.id}`,
    source: "lever",
    company: titleCase(company),
    title: job.text,
    location: job.categories?.location ?? "Unspecified",
    url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    body,
    department: job.categories?.team || job.categories?.department || undefined,
    commitment: job.categories?.commitment || undefined,
    workplace: leverWorkplace(job.workplaceType),
    salary: leverSalary(job.salaryRange),
  };
}

export type RawHnPosting = { id: number; text?: string; time?: number };

/**
 * HN "Who is hiring" top-level comments loosely follow
 * `Company | Role | Location | ...details`. Parse the first pipe-fields as
 * company/title; keep the whole decoded text as the body. Returns null when
 * empty/deleted.
 */
export function normalizeHn(job: RawHnPosting): JobPosting | null {
  if (!job.text) return null;
  const text = stripHtml(job.text);
  if (!text) return null;
  const fields = text.split("|").map((f) => f.trim());
  const company = fields[0] || "Unknown";
  const title = fields[1] || "Engineering role";
  const location = fields[2] || "Unspecified";
  return {
    id: `hn:${job.id}`,
    source: "hn",
    company,
    title,
    location,
    url: `https://news.ycombinator.com/item?id=${job.id}`,
    postedAt: job.time ? new Date(job.time * 1000).toISOString() : null,
    body: text,
  };
}

/** Metadata preamble + body: what actually gets embedded, so retrieval sees the rich fields. */
export function buildEmbedText(p: JobPosting): string {
  const bits = [p.workplace, p.department, p.salary, p.commitment]
    .filter((b): b is string => !!b);
  const preamble = bits.length ? `[${bits.join(" · ")}] ` : "";
  return `${preamble}${p.title}. ${p.body}`;
}
