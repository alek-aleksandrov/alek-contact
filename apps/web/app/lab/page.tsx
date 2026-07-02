"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { Item } from "@repo/shared";

import { Section, SectionHeading } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { createItem, fetchItems } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LabPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems()
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setSubmitting(true);
    try {
      const created = await createItem({ title: value });
      setItems((prev) => [created, ...prev]);
      setTitle("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section>
      <SectionHeading
        eyebrow="Full-stack demo"
        title="Lab"
        description="A live vertical slice: this list is served by a Nest.js API, stored in Postgres via Prisma. The Item type is shared between the front end and back end from one package."
      />

      <form onSubmit={onSubmit} className="mt-10 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add an item…"
          maxLength={200}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-5")}
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="mt-8">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {status === "error" && (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t reach the API. Make sure it&apos;s running at{" "}
            <code className="font-mono">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}
            </code>
            .
          </p>
        )}
        {status === "ready" && (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
            {items.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No items yet — add one above.
              </li>
            )}
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <span className="text-sm">{item.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
