/**
 * Work experience + skills, sourced from the resume.
 * Edit here and the home + about pages update automatically.
 */

export type Experience = {
  company: string;
  role: string;
  /** e.g. "2023" or "Jan 2023" — free-form, displayed as-is. */
  start: string;
  end: string | "Present";
  location?: string;
  summary: string;
  highlights: string[];
  tech: string[];
};

export const experience: Experience[] = [
  {
    company: "Ninety",
    role: "Senior Software Engineer",
    start: "Oct 2023",
    end: "Present",
    location: "Remote",
    summary:
      "Working at the intersection of AI orchestration and full-stack delivery on a productivity SaaS platform — bridging legacy enterprise systems with AI-native tooling, and owning hybrid mobile.",
    highlights: [
      "Built MCP servers and context-provider middleware that bridge legacy REST APIs into Amazon Bedrock reasoning loops, exposing internal data and tools to LLM agents.",
      "Shipped the client and operation-handling layer for Maz, a conversational scorecard optimizer on Bedrock, with a propose-approve-apply loop keeping multi-step edits coherent.",
      "Authored custom Claude Code skills, plugins, and multi-agent workflows (ticket-to-PR, PR-comment resolution, a parallel Cypress auto-fix orchestrator) that automate the engineering lifecycle.",
      "Spearheaded a hybrid mobile app with Ionic/Capacitor, establishing the CI/CD pipeline and team contribution standards.",
      "Refactored legacy state into NgRx within an NX monorepo and added distributed tracing to backend KPI scoring; resolved customer-reported production defects through deployment.",
    ],
    tech: [
      "Amazon Bedrock",
      "MCP",
      "Angular",
      "NgRx",
      "TypeScript",
      "Ionic/Capacitor",
      "Node.js",
      "NX",
    ],
  },
  {
    company: "IPRO",
    role: "Senior Web Developer",
    start: "Oct 2019",
    end: "Oct 2023",
    location: "Henderson, NV",
    summary:
      "Modernized a legal eDiscovery platform — porting complex legacy tools to Angular micro frontends while preserving established workflows.",
    highlights: [
      "Ported 4 complex legacy eDiscovery tools to Angular micro frontends within a shared monorepo.",
      "Built the unit and E2E test suites that made continuous deployment of the migrated frontends safe, using legacy behavior as the spec.",
      "Mentored junior developers through code reviews and best practices, reducing regression risk.",
    ],
    tech: ["Angular", "TypeScript", "Micro Frontends", "RxJS", "Cypress"],
  },
  {
    company: "Paysign, Inc.",
    role: "Front End Developer",
    start: "May 2018",
    end: "Oct 2019",
    location: "Henderson, NV",
    summary:
      "Built cross-platform apps for a payment services provider across kiosk, web, and mobile.",
    highlights: [
      "Developed cross-platform SPAs for kiosk, web, and mobile using Angular and Ionic/Capacitor across 5+ enterprise products.",
      "Modernized testing workflows by configuring Protractor (E2E) and Karma (Unit), improving reliability and reducing manual QA.",
    ],
    tech: ["Angular", "Ionic/Capacitor", "JavaScript", "Karma"],
  },
];

/** Skills grouped for the About page. */
export const skills: { group: string; items: string[] }[] = [
  {
    group: "Frontend",
    items: [
      "Angular",
      "React",
      "Next.js",
      "TypeScript",
      "NgRx",
      "RxJS",
      "Ionic/Capacitor",
      "SCSS",
    ],
  },
  {
    group: "AI & Orchestration",
    items: ["Amazon Bedrock", "MCP", "Prompt Engineering", "AI Orchestration"],
  },
  {
    group: "Backend & DevOps",
    items: [
      "Node.js",
      "Nest.js",
      "AWS Serverless",
      "Postgres",
      "MongoDB",
      "NX Monorepo",
      "CI/CD",
    ],
  },
  {
    group: "Testing",
    items: ["Cypress", "Jest", "Karma", "Jasmine", "Spectator"],
  },
];

export const bio =
  "I'm a Senior Software Engineer at Ninety, working where AI orchestration meets full-stack product development. I build systems that bridge legacy enterprise architectures with AI-native tooling — MCP servers and context middleware feeding Amazon Bedrock reasoning loops — alongside hybrid mobile apps and modern Angular frontend architecture. I care about product observability and end-user advocacy. Angular is my daily driver; the projects on this site are where I stretch into new stacks like Next.js and MCP.";
