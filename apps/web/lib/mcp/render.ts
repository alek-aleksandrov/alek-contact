/**
 * Render helpers: turn the typed content modules (the single source of truth)
 * into the markdown strings the MCP resources and tools return.
 *
 * No content lives here — everything is derived from `@/content/*`.
 */

import {
  experience,
  skills,
  bio,
  recommendations,
  education,
  languages,
  type Experience,
} from "@/content/experience";
import { site } from "@/content/site";
import { projects, type Project } from "@/content/projects";

function renderExperienceEntry(job: Experience): string {
  const lines: string[] = [];
  lines.push(`### ${job.role} — ${job.company}`);
  lines.push(
    `*${job.start} – ${job.end}${job.location ? ` · ${job.location}` : ""}*`,
  );
  lines.push("");
  lines.push(job.summary);
  lines.push("");
  lines.push("**Highlights**");
  for (const h of job.highlights) lines.push(`- ${h}`);
  lines.push("");
  lines.push(`**Tech:** ${job.tech.join(", ")}`);
  return lines.join("\n");
}

function renderProjectEntry(project: Project): string {
  const lines: string[] = [];
  const statusLabel =
    project.status === "live"
      ? "Live"
      : project.status === "in-progress"
        ? "In progress"
        : "Planned";
  lines.push(`### ${project.title} (${statusLabel})`);
  lines.push(`*${project.tagline}*`);
  lines.push("");
  lines.push(project.description);
  if (project.highlights?.length) {
    lines.push("");
    lines.push("**Highlights**");
    for (const h of project.highlights) lines.push(`- ${h}`);
  }
  lines.push("");
  lines.push(`**Stack:** ${project.stack.join(", ")}`);
  if (project.links?.length) {
    const links = project.links
      .map((l) => `[${l.label}](${l.href})`)
      .join(" · ");
    lines.push(`**Links:** ${links}`);
  }
  return lines.join("\n");
}

/** `alek://profile/summary` — identity, tagline, bio. */
export function renderSummary(): string {
  return [
    `# ${site.fullName} (${site.name})`,
    `**${site.role}** · ${site.location}`,
    "",
    site.tagline,
    "",
    "## Bio",
    bio,
    "",
    "## Links",
    ...site.links.map((l) => `- [${l.label}](${l.href})`),
    "",
    `**Languages:** ${languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")}`,
    "",
    `Contact: ${site.email}`,
  ].join("\n");
}

/** `alek://profile/recommendations` — colleague recommendations. */
export function renderRecommendations(): string {
  const entries = recommendations.map((r) =>
    [`> ${r.text}`, "", `— **${r.name}**, ${r.title} (${r.relationship})`].join(
      "\n",
    ),
  );
  return ["# Recommendations", "", ...entries].join("\n\n");
}

/** `alek://profile/education` — education + languages. */
export function renderEducation(): string {
  const schools = education.map(
    (e) => `- **${e.school}** — ${e.credential} (${e.start}–${e.end})`,
  );
  const langs = languages.map((l) => `- ${l.name} — ${l.proficiency}`);
  return [
    "# Education",
    "",
    ...schools,
    "",
    "## Languages",
    ...langs,
  ].join("\n");
}

/** `alek://profile/experience` — full work history. */
export function renderExperience(): string {
  return ["# Work Experience", "", ...experience.map(renderExperienceEntry)].join(
    "\n\n",
  );
}

/** `alek://profile/skills` — grouped skills. */
export function renderSkills(): string {
  const groups = skills.map(
    (g) => `## ${g.group}\n${g.items.map((i) => `- ${i}`).join("\n")}`,
  );
  return ["# Skills", "", ...groups].join("\n\n");
}

/** `alek://profile/projects` — portfolio projects. */
export function renderProjects(): string {
  return ["# Projects", "", ...projects.map(renderProjectEntry)].join("\n\n");
}

/**
 * `alek://profile/resume` — the structured resume text (experience + skills +
 * bio) plus a link to the PDF. Deliberately no PDF parsing: the structured
 * content here is the source of truth.
 */
export function renderResume(): string {
  return [
    `# Resume — ${site.fullName}`,
    `**${site.role}** · ${site.location} · ${site.email}`,
    "",
    `PDF: [${site.resumeUrl}](${site.resumeUrl})`,
    "",
    "## Summary",
    bio,
    "",
    renderExperience(),
    "",
    renderSkills(),
  ].join("\n");
}

/**
 * Short tl;dr used by the `get_summary` tool: role, the AI-orchestration/MCP
 * focus, and headline strengths.
 */
export function renderTldr(): string {
  return [
    `**${site.fullName}** — ${site.role} (${site.location}).`,
    "",
    "Works at the intersection of **AI orchestration and full-stack delivery**: " +
      "builds **MCP servers** and context-provider middleware that bridge legacy " +
      "REST APIs into **Amazon Bedrock** reasoning loops, and authors Claude Code " +
      "skills, plugins, and multi-agent workflows that automate the engineering lifecycle.",
    "",
    "**Headline strengths**",
    "- Production AI orchestration: MCP + Amazon Bedrock (propose-approve-apply agent loops).",
    "- Full-stack + hybrid mobile: Angular/NgRx, Next.js/React, Ionic/Capacitor, Node.js/Nest.js.",
    "- Testing & delivery: Cypress/Jest, CI/CD, NX monorepos, distributed tracing.",
    "",
    `Ask about specific areas with \`search_experience\`, or read the \`alek://profile/*\` resources. Contact: ${site.email}.`,
  ].join("\n");
}
