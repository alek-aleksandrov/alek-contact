import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { statusLabel, statusVariant } from "@/components/project-card";
import { Container } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getProject, projects } from "@/content/projects";
import { cn } from "@/lib/utils";

// Next 16: params is a Promise. Prerender one page per project at build time.
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.tagline };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) notFound();

  const hasLinks = project.links && project.links.length > 0;

  return (
    <Container className="max-w-3xl py-16 sm:py-24">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All projects
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Badge variant={statusVariant[project.status]}>
          {statusLabel[project.status]}
        </Badge>
        {project.year ? (
          <span className="font-mono text-sm text-muted-foreground">
            {project.year}
          </span>
        ) : null}
      </div>

      <h1 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        {project.title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{project.tagline}</p>

      <p className="mt-8 leading-relaxed text-foreground/90">
        {project.description}
      </p>

      {project.highlights && project.highlights.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Highlights
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground marker:text-foreground/30">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Stack
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-12 border-t border-border/60 pt-8">
        {hasLinks ? (
          <div className="flex flex-wrap gap-3">
            {project.links!.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                {link.label}
                <ArrowUpRight />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This one&apos;s still in the works — links will appear here once it
            ships.
          </p>
        )}
      </div>
    </Container>
  );
}
