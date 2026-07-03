import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Copy, FileText } from "lucide-react";

import { AskConsole } from "@/components/console/ask-console";
import { Breadcrumb } from "@/components/breadcrumb";
import { CopyButton } from "@/components/copy-button";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@repo/shared";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "tl;dr",
  description:
    "Too busy to read a résumé? Same. Ask a live model about me right here — it runs on my dime, or connect the MCP server yourself.",
};

const mcpJson = `{
  "mcpServers": {
    "ask-about-alek": {
      "url": "${site.mcpUrl}"
    }
  }
}`;

export default function TldrPage() {
  return (
    <Section>
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: "tl;dr" },
        ]}
      />
      {/* Hero */}
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        TL;DR
      </p>
      <h1 className="font-heading mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Too busy to read a résumé? Same.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        So I turned myself into a model you can interrogate. Ask away below — it
        answers on a free model I&apos;m footing the bill for, and only knows the
        truth, straight from my profile.
      </p>

      {/* Console — the centerpiece */}
      <div className="mt-10 max-w-2xl">
        <AskConsole />
      </div>

      {/* Bring your own client */}
      <div className="mt-14 border-t border-border/60 pt-10">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Prefer your own client?
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          It&apos;s a real MCP server. Point Claude, Cursor, or any MCP-capable
          client at it:
        </p>

        <div className="mt-5 max-w-2xl">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <code className="truncate font-mono text-sm sm:text-base">
              {site.mcpUrl}
            </code>
            <CopyButton
              value={site.mcpUrl}
              copiedLabel="Copied ✓"
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              <Copy className="size-4" />
              Copy
            </CopyButton>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-5">
            <p className="font-heading text-sm font-medium">Claude.ai / Desktop</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Settings → Connectors → <em>Add custom connector</em> → paste the
              URL above.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-sm font-medium">Cursor / mcp.json</p>
              <CopyButton
                value={mcpJson}
                copiedLabel="Copied ✓"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "xs" }),
                  "text-muted-foreground",
                )}
              >
                <Copy className="size-3" />
                Copy
              </CopyButton>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {mcpJson}
            </pre>
          </div>
        </div>
      </div>

      {/* Prefer paper */}
      <div className="mt-14 border-t border-border/60 pt-8">
        <p className="text-sm text-muted-foreground">
          Old-school? Here&apos;s the résumé like it&apos;s 2015.
        </p>
        <a
          href={site.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "mt-3")}
        >
          <FileText />
          Résumé (PDF)
        </a>
      </div>

      {/* Wink */}
      <p className="mt-12 max-w-2xl text-sm text-muted-foreground/70 italic">
        Yes — it&apos;s an MCP server built by someone who builds MCP servers for
        a living, now with a model bolted on. Meta, I know.{" "}
        <Link
          href="/projects/ask-about-alek"
          className="inline-flex items-center gap-1 text-muted-foreground not-italic underline-offset-4 hover:text-foreground hover:underline"
        >
          how it works
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </Section>
  );
}
