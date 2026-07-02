import type { CreateItemInput, Item } from "@repo/shared";

// Nest.js API base URL. Railway URL in production, local Nest in dev.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API_URL}/api/items`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
  return res.json();
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const res = await fetch(`${API_URL}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create item (${res.status})`);
  return res.json();
}
