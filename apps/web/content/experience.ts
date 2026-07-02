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
      "Full-stack contributor and product advocate at the intersection of AI orchestration and modern delivery on a productivity SaaS platform — bridging legacy enterprise systems with AI-native tooling, owning hybrid mobile, and pairing high-scale refactoring with a user-first engineering philosophy.",
    highlights: [
      "Built MCP servers and context-provider middleware that bridge legacy REST APIs into Amazon Bedrock reasoning loops, exposing internal data and tools to LLM agents.",
      "Shipped the client and operation-handling layer for Maz, a conversational scorecard optimizer on Bedrock, with a propose-approve-apply loop keeping multi-step edits coherent.",
      "Authored custom Claude Code skills, plugins, and multi-agent workflows (ticket-to-PR, PR-comment resolution, a parallel Cypress auto-fix orchestrator) that automate the engineering lifecycle.",
      "Spearheaded a hybrid mobile app with Ionic/Capacitor, establishing the CI/CD pipeline and team contribution standards.",
      "Refactored legacy state into NgRx within an NX monorepo and added distributed tracing to backend KPI scoring; resolved customer-reported production defects through deployment.",
      "Improved developer experience with API context providers and internal tooling that make AI-native features easier to build and maintain, and served as the primary mentor for the hybrid mobile stack.",
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

/** Colleague recommendations (from LinkedIn). */
export type Recommendation = {
  name: string;
  title: string;
  /** Working relationship to Alek. */
  relationship: string;
  text: string;
};

export const recommendations: Recommendation[] = [
  {
    name: "John Olson",
    title: "Product engineering leader",
    relationship: "Managed Alek directly at IPRO",
    text: "I've had the pleasure of working with Alek at IPRO for four years. In those four years, he's shown tremendous growth, both as an engineer and as a person. As a senior web developer, he built quality solutions across various front-end frameworks within the company. Alek was instrumental to the success of the import processing settings application — working with the product manager to define requirements, with backend engineers on API design, and building the complex UI required to manage every possible scenario. He was always available to mentor others, and constantly looking to grow his own engineering skills and refine his leadership style. Alek would be an asset for any organization looking for a senior web developer with a focus on quality and team building.",
  },
  {
    name: "Tanner J. V. Comes",
    title: "Web Application Engineer",
    relationship: "Worked with Alek at IPRO",
    text: "Alek was the lead engineer on a project we worked on together when I was still quite green in my role as a software developer. During this time, Alek helped shape me into a better developer through positive, constructive feedback and pair-programming sessions. He is very approachable for questions, and generous and patient when sharing his expertise. Even before he grew into his senior role, he was always happy to put down what he was doing to lend a hand to a teammate in need. Alek partners with product management and fellow developers to make sure only the best version of the product comes to light; the changes he proposes are rooted in best practices and a desire to leave the code better than he found it. No matter where his next role takes him, I'm certain Alek will raise the bar for excellence and leave a lasting impression, just as he did with ours.",
  },
];

/** Education history. */
export type Education = {
  school: string;
  credential: string;
  start: string;
  end: string;
};

export const education: Education[] = [
  {
    school: "University of Nevada, Las Vegas",
    credential: "Computer Science",
    start: "2014",
    end: "2016",
  },
  {
    school: "Southwest Career and Technical Academy",
    credential: "Web Design & Development",
    start: "2010",
    end: "2014",
  },
];

/** Spoken languages. */
export type Language = { name: string; proficiency: string };

export const languages: Language[] = [
  { name: "Bulgarian", proficiency: "Native" },
  { name: "English", proficiency: "Professional" },
];
