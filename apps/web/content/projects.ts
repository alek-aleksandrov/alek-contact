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
  /**
   * If set, the project CARD links here (e.g. a live/interactive page) instead
   * of the /projects/[slug] detail page, and the detail page shows a prominent
   * "Try it live" CTA pointing to it.
   */
  href?: string;
  /** Multi-line shell/CLI snippet rendered as an "Install" code block on the detail page. */
  install?: string;
  /** Optional demo asset (gif/mp4) shown on the detail page. Path lives in /public. */
  demo?: { src: string; alt: string };
};

export const projects: Project[] = [
  {
    slug: "claude-code-toolkit",
    title: "Claude Code Toolkit",
    tagline:
      "My custom Claude Code agents + commands, packaged as an installable plugin.",
    description:
      "A public Claude Code plugin that bundles the agents and slash-commands I actually use day to day into one install. It spans the whole engineering lifecycle — opening PRs, reviewing diffs for security and performance, running multi-session projects, logging sessions, reproducing bugs in a real browser, triaging incidents, and managing Jira — distributed through a Claude Code marketplace so anyone can add it in two commands.",
    status: "in-progress",
    stack: ["Claude Code", "Plugins", "Markdown", "YAML", "Agents"],
    highlights: [
      "pr-creator — opens/updates GitHub PRs with clean what-and-why descriptions via gh",
      "security-perf-reviewer — audits the current diff for web vulns and high-impact perf issues",
      "project-manager — multi-session Research→Plan→Review→Implement→Validate in .ai/projects/",
      "session-logger — structured, Obsidian-compatible daily session logs",
      "playwright-browser-tester — reproduces bugs in real Chrome before any code change",
      "incident-responder — SRE triage on Rootly with historical incident matching",
      "jira-ticket-manager — view/search/create/edit Jira tickets via acli + JQL",
      "/project and /review — slash-commands that drive the project-manager and reviewer agents",
    ],
    install:
      "/plugin marketplace add alek-aleksandrov/claude-toolkit\n/plugin install engineering-toolkit@claude-toolkit",
    year: 2026,
    featured: true,
    // Flip to status: "live" + add links:[{label:"Repo",href:"https://github.com/alek-aleksandrov/claude-toolkit"}]
    // once the repo is pushed public. Add `demo` once a real gif is recorded.
  },
  {
    slug: "multi-agent-visualizer",
    title: "Multi-Agent Workflow Visualizer",
    tagline: "Watch a research → critique → synthesize agent pipeline run, live.",
    description:
      "An interactive page where you ask a question and watch a real multi-agent pipeline execute: three researcher agents fan out in parallel (optimist, skeptic, pragmatist), an adversarial critic checks their work and returns a PASS/FAIL verdict, and a synthesizer merges everything into a final answer. Every node animates from live LLM calls — nothing is scripted. It's the AI-orchestration pattern I work with day to day, made visible.",
    status: "live",
    stack: ["Next.js", "React 19", "TypeScript", "LLM orchestration", "Streaming"],
    highlights: [
      "Parallel fan-out (Promise.all) with per-node streaming and error isolation",
      "Adversarial critic with a parsed PASS/FAIL verdict",
      "Dependency-light live graph — CSS columns + SVG connectors, no graph lib",
    ],
    year: 2026,
    featured: true,
    // Card + detail-page CTA funnel to the live experience.
    href: "/lab/multi-agent",
  },
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
    status: "live",
    stack: ["Next.js", "MCP", "TypeScript", "LLM"],
    highlights: [
      "Model Context Protocol server exposing a queryable candidate profile",
      "One shareable link — paste into any MCP-capable LLM client",
      "Dogfoods the Bedrock/MCP orchestration work from my day job",
    ],
    year: 2026,
    featured: true,
    // Card + detail-page CTA both funnel to the live /tldr experience.
    href: "/tldr",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const featuredProjects = projects.filter((p) => p.featured);
