/**
 * Single source of truth for identity + links.
 *
 * Links are data-driven: add or remove an entry below and the nav, footer, and
 * about page all update. (Phone is intentionally omitted from the public site.)
 */

export type SiteLink = {
  label: string;
  href: string;
  /** Optional lucide/brand icon, resolved in components/social-links.tsx. */
  icon?: "github" | "linkedin" | "mail" | "file-text";
  /** External links open in a new tab. */
  external?: boolean;
};

export const site = {
  name: "Alek",
  fullName: "Aleksandar Aleksandrov",
  role: "Senior Software Engineer",
  tagline:
    "I work where AI orchestration meets full-stack product development — bridging enterprise systems with AI-native tooling on Amazon Bedrock and MCP. Angular by day; the projects here are where I explore new stacks.",
  resumeUrl: "/alek-resume.pdf",
  email: "alek.aleksandrov@proton.me",
  location: "Las Vegas, NV",
  // Public URL of the "Ask About Alek" MCP server (the /mcp route handler).
  mcpUrl: "https://alek-contact.com/mcp",
  // Public source repository for this portfolio.
  repoUrl: "https://github.com/alek-aleksandrov/nextjs-boilerplate",

  links: [
    { label: "Resume", href: "/alek-resume.pdf", icon: "file-text", external: true },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/aleksandar-aleksandrov-128b5172",
      icon: "linkedin",
      external: true,
    },
    { label: "Email", href: "mailto:alek.aleksandrov@proton.me", icon: "mail" },
    { label: "GitHub", href: "https://github.com/alek-aleksandrov", icon: "github", external: true },
  ] satisfies SiteLink[],
} as const;

export type Site = typeof site;
