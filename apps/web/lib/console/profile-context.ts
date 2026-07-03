/**
 * Builds the grounding system prompt shared by both answer engines (WebLLM in
 * the browser and the hosted /api/ask proxy). All content comes from the same
 * render functions that power the MCP server — single source of truth.
 */

import {
  renderSummary,
  renderExperience,
  renderSkills,
  renderProjects,
  renderRecommendations,
  renderEducation,
} from "@repo/shared";

/** The full profile as one markdown blob (a few KB — fits in context, no RAG). */
export function buildProfileContext(): string {
  return [
    renderSummary(),
    renderExperience(),
    renderSkills(),
    renderProjects(),
    renderRecommendations(),
    renderEducation(),
  ].join("\n\n---\n\n");
}

/** System prompt: persona + guardrails + the profile context. */
export function buildSystemPrompt(): string {
  return [
    'You are the "Ask About Alek" assistant embedded on Alek Aleksandrov\'s portfolio.',
    "You answer a recruiter's questions about Alek as a job candidate.",
    "",
    "Rules:",
    "- Use ONLY the profile below. Do not invent employers, dates, skills, or projects.",
    "- If the answer isn't in the profile, say so plainly and point to what is covered.",
    "- Speak about Alek in the third person. Be concise and specific; back claims with a highlight, project, or skill.",
    "- Politely decline anything that isn't about Alek as a candidate.",
    "",
    "=== ALEK PROFILE ===",
    buildProfileContext(),
    "=== END PROFILE ===",
  ].join("\n");
}
