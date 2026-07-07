/** Verified live Greenhouse board slugs (return engineering roles). */
export const GREENHOUSE_COMPANIES = [
  "stripe", "airbnb", "figma", "databricks", "anthropic", "gitlab",
  "discord", "coinbase", "robinhood", "dropbox", "brex", "samsara",
  "mixpanel", "airtable", "asana",
];

/** Lever board slugs — best-effort (many public boards 404/empty; verify before adding). */
export const LEVER_COMPANIES: string[] = [];

export const HN_WHOISHIRING_USER = "whoishiring";
export const HN_MAX_COMMENTS = 40;

/** Corpus ceiling. Round-robin fills these slots across all companies/sources. */
export const MAX_POSTINGS = 500;

/** Best-effort workplace classification from a location string. */
export function inferWorkplace(
  location: string | null | undefined,
): "Remote" | "Hybrid" | "Onsite" | null {
  if (!location) return null;
  const l = location.toLowerCase();
  if (l.includes("hybrid")) return "Hybrid";
  if (l.includes("remote")) return "Remote";
  return "Onsite";
}
