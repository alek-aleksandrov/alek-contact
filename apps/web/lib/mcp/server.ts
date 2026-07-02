/**
 * Wires the "Ask About Alek" MCP surface onto a server instance:
 *   - 5 resources (alek://profile/*), all text/markdown
 *   - 2 tools (get_summary, search_experience), read-only, no side effects
 *   - 1 prompt (assess_alek_for_role)
 *
 * All content is derived from `@/content/*` via `render.ts` — single source of
 * truth, no duplication.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  renderSummary,
  renderExperience,
  renderSkills,
  renderProjects,
  renderResume,
  renderRecommendations,
  renderEducation,
  renderTldr,
} from "./render";
import { searchProfile } from "./search";

const MARKDOWN = "text/markdown";

type ResourceDef = {
  name: string;
  uri: string;
  title: string;
  description: string;
  render: () => string;
};

const RESOURCES: ResourceDef[] = [
  {
    name: "profile-summary",
    uri: "alek://profile/summary",
    title: "Alek — Profile Summary",
    description: "Identity, current role, tagline, and short bio.",
    render: renderSummary,
  },
  {
    name: "profile-experience",
    uri: "alek://profile/experience",
    title: "Alek — Work Experience",
    description: "Full work history with highlights and tech per role.",
    render: renderExperience,
  },
  {
    name: "profile-skills",
    uri: "alek://profile/skills",
    title: "Alek — Skills",
    description: "Skills grouped by area (frontend, AI, backend, testing).",
    render: renderSkills,
  },
  {
    name: "profile-projects",
    uri: "alek://profile/projects",
    title: "Alek — Projects",
    description: "Portfolio projects with status, stack, and highlights.",
    render: renderProjects,
  },
  {
    name: "profile-resume",
    uri: "alek://profile/resume",
    title: "Alek — Resume",
    description:
      "Structured resume text (summary, experience, skills) plus a link to the PDF.",
    render: renderResume,
  },
  {
    name: "profile-recommendations",
    uri: "alek://profile/recommendations",
    title: "Alek — Recommendations",
    description:
      "Colleague and manager recommendations attesting to Alek's work.",
    render: renderRecommendations,
  },
  {
    name: "profile-education",
    uri: "alek://profile/education",
    title: "Alek — Education & Languages",
    description: "Education history and spoken languages.",
    render: renderEducation,
  },
];

export function registerAll(server: McpServer): void {
  // ---- Resources -----------------------------------------------------------
  for (const r of RESOURCES) {
    server.registerResource(
      r.name,
      r.uri,
      { title: r.title, description: r.description, mimeType: MARKDOWN },
      async (uri) => ({
        contents: [
          { uri: uri.href, mimeType: MARKDOWN, text: r.render() },
        ],
      }),
    );
  }

  // ---- Tools ---------------------------------------------------------------
  server.registerTool(
    "get_summary",
    {
      title: "Get Summary",
      description:
        "A tl;dr about Alek: current role, his focus on AI orchestration / MCP, and headline strengths.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ({
      content: [{ type: "text", text: renderTldr() }],
    }),
  );

  server.registerTool(
    "search_experience",
    {
      title: "Search Experience",
      description:
        "Search Alek's highlights, skills, and projects for a keyword (e.g. \"Bedrock\", \"Angular\", \"testing\"). Returns matching lines with their source.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Keyword or phrase to search for, case-insensitive."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query }) => {
      const hits = searchProfile(query);
      if (hits.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No matches for "${query}". Try a broader term, or read the alek://profile/* resources.`,
            },
          ],
        };
      }
      const md = [
        `# Matches for "${query}" (${hits.length})`,
        "",
        ...hits.map((h) => `- **${h.source}** — ${h.text}`),
      ].join("\n");
      return { content: [{ type: "text", text: md }] };
    },
  );

  // ---- Prompt --------------------------------------------------------------
  server.registerPrompt(
    "assess_alek_for_role",
    {
      title: "Assess Alek for a Role",
      description:
        "Assess Alek's fit for a specific role by reading his profile resources.",
      argsSchema: {
        role: z
          .string()
          .min(1)
          .describe('Target role, e.g. "Senior AI Engineer".'),
        seniority: z
          .string()
          .optional()
          .describe('Optional seniority, e.g. "Staff" or "Senior".'),
      },
    },
    ({ role, seniority }) => {
      const seniorityText = seniority ? ` at the ${seniority} level` : "";
      const text = [
        `You are assessing whether Aleksandar "Alek" Aleksandrov is a good fit for the role of "${role}"${seniorityText}.`,
        "",
        "First, read these MCP resources to gather evidence:",
        "- alek://profile/summary",
        "- alek://profile/experience",
        "- alek://profile/skills",
        "- alek://profile/projects",
        "- alek://profile/resume",
        "",
        "You can also call the `search_experience` tool for specific keywords relevant to the role.",
        "",
        "Then produce a concise assessment with two sections:",
        `1. **Strengths** — where Alek fits the role, each backed by specific evidence (a highlight, project, or skill) from the resources.`,
        "2. **Gaps** — honest areas where the profile shows little or no evidence for this role.",
        "",
        "Base every claim on the resource content; do not invent experience that isn't there.",
      ].join("\n");

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    },
  );
}
