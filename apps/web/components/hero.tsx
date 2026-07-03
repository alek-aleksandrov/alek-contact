import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { site } from "@repo/shared";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <div className="flex flex-col items-start gap-6 py-20 sm:py-28">
      <p className="font-mono text-sm text-muted-foreground">
        Hi, I&apos;m {site.name} —
      </p>

      <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        {site.role} building fast, thoughtful web products.
      </h1>

      <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
        {site.tagline}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Link
          href="/projects"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-5")}
        >
          View projects
          <ArrowRight />
        </Link>
        <a
          href={site.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-10 px-5",
          )}
        >
          <FileText />
          Resume
        </a>
      </div>
    </div>
  );
}
