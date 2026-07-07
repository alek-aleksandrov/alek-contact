import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Breadcrumb } from "@/components/breadcrumb";
import { GithubIcon } from "@/components/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Section } from "@/components/section";
import { MarketFitConsole } from "@/components/jobs/market-fit-console";
import { getJobAskMeta } from "@/lib/jobs/api";
import { site } from "@repo/shared";

// Reads corpus meta from the Nest API per request, so the Vercel build never
// depends on the API being reachable (mirrors /finance).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Market Fit",
  description:
    "Ask about the engineering job market and get answers grounded in real, cited job postings. A RAG app on LangChain.js over a self-updating pgvector index.",
};

export default async function MarketFitPage() {
  const meta = await getJobAskMeta();
  const refreshed = meta.refreshedAt
    ? new Date(meta.refreshedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "recently";

  return (
    <Section>
      <Breadcrumb
        items={[{ label: "Projects", href: "/projects" }, { label: "Market Fit" }]}
      />
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Market Fit
      </p>
      <h1 className="font-heading mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Ask the job market.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        Natural-language questions about what companies are hiring for, answered
        from real job postings and cited so you can check the source. Retrieval
        runs over a LangChain.js pipeline with a pgvector index.
      </p>

      <div className="mt-10 max-w-2xl">
        <MarketFitConsole />
      </div>

      <p className="mt-8 max-w-2xl font-mono text-xs text-muted-foreground/70">
        Corpus: {meta.count} postings · refreshed {refreshed}. Sources:
        Greenhouse, Lever, Hacker News. A frozen snapshot ships with the repo.
      </p>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border/60 pt-8">
        <Link
          href="/projects/market-fit"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          How it works
          <ArrowRight />
        </Link>
        <a
          href={site.repoUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-10")}
        >
          <GithubIcon />
          View source
          <ArrowUpRight />
        </a>
      </div>
    </Section>
  );
}
