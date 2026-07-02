/**
 * Portfolio projects.
 *
 * This is the core "edit one object to ship a project" surface. A project starts
 * as `status: "planned"` or `"in-progress"` (renders a status badge, no dead
 * links) and flips to `"live"` with real `links` the moment the app is deployed.
 *
 * Add a project = append one object here. `generateStaticParams` in
 * app/projects/[slug]/page.tsx picks it up automatically.
 */

export type ProjectStatus = "live" | "in-progress" | "planned";

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  /** Tech used / planned, e.g. ["Next.js", "Nest.js", "PostgreSQL"]. */
  stack: string[];
  highlights?: string[];
  /** Live demo / repo. Omit or leave empty while planned/in-progress. */
  links?: ProjectLink[];
  year?: number;
  /** Optional cover image path in /public. */
  cover?: string;
  /** Surface on the home page. */
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "financial-dashboard",
    title: "Financial Dashboard",
    tagline: "One screen for the market data I check every day.",
    description:
      "A personal dashboard that pulls together the financial data I look at most — prices, movers, and the metrics that actually inform decisions — into a single fast, glanceable view. Built as a full-stack app: a Next.js front end talking to a Nest.js API that ingests and caches market data in a relational database.",
    status: "in-progress",
    stack: ["Next.js", "React", "Nest.js", "PostgreSQL", "TypeScript"],
    highlights: [
      "Nest.js service layer ingesting and normalizing data from market APIs",
      "PostgreSQL for historical series with cached, rate-limit-friendly reads",
      "Server-rendered Next.js UI with live-updating widgets",
    ],
    year: 2026,
    featured: true,
    // links added when deployed:
    // links: [{ label: "Live", href: "https://..." }, { label: "Code", href: "https://github.com/..." }],
  },
  {
    slug: "portfolio-site",
    title: "This Portfolio",
    tagline: "The site you're on — Next.js 16, React 19, Tailwind v4.",
    description:
      "A content-driven portfolio built on the latest Next.js App Router. Pages render from typed content modules, dark mode follows your OS with zero JavaScript, and subtle motion brings sections in as you scroll. Deployed on Vercel.",
    status: "live",
    stack: ["Next.js 16", "React 19", "Tailwind CSS v4", "shadcn/ui", "Motion"],
    highlights: [
      "Typed content modules — add a project by editing one object",
      "System-preference dark mode via pure CSS (no theme flash)",
      "Statically generated project pages with per-project metadata",
    ],
    year: 2026,
    featured: true,
    links: [{ label: "Live", href: "/" }],
    // TODO: add the GitHub repo link once pushed.
  },
  {
    slug: "ask-about-alek",
    title: "Ask About Alek",
    tagline: "An MCP endpoint an LLM can query to answer questions about me.",
    description:
      "A public, shareable endpoint a recruiter can drop into an LLM (Claude, etc.) to ask questions about my background — \"tl;dr about Alek,\" \"does he have production AI experience?\" — answered from a structured profile. Built as an MCP server exposed from this Next.js app: the same AI-orchestration pattern I work with day to day, turned on myself.",
    status: "in-progress",
    stack: ["Next.js", "MCP", "TypeScript", "LLM"],
    highlights: [
      "Model Context Protocol server exposing a queryable candidate profile",
      "One shareable link — paste into any MCP-capable LLM client",
      "Dogfoods the Bedrock/MCP orchestration work from my day job",
    ],
    year: 2026,
    featured: true,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const featuredProjects = projects.filter((p) => p.featured);
