/** Shared console config — safe to import on client and server (pure constants). */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Hard cap on a single user question (chars). Bounds cost + abuse. */
export const MAX_INPUT_CHARS = 500;

/** Seed questions shown as clickable chips inside the console. */
export const SUGGESTED_QUESTIONS = [
  "tl;dr about Alek",
  "Does he have real production AI experience?",
  "Assess him for a senior React role",
  "What's his frontend depth?",
];
