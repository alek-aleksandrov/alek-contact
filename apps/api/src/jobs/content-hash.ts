import { createHash } from "node:crypto";
import type { JobPosting } from "@repo/shared";
import { buildEmbedText } from "./job-normalize";

/**
 * SHA-256 of the exact text that gets embedded. Ingest compares this against
 * the stored hash to decide whether a posting must be re-embedded.
 */
export function contentHash(p: JobPosting): string {
  return createHash("sha256").update(buildEmbedText(p)).digest("hex");
}
