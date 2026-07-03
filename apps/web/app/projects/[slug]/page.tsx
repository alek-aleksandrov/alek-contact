import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Breadcrumb } from "@/components/breadcrumb";
import { GithubIcon } from "@/components/brand-icons";
import { statusLabel, statusVariant } from "@/components/project-card";
import { Container } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getProject, projects } from "@repo/shared";
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
  const hasActions = project.href || hasLinks || project.sourceHref;

  return (
    <Container className="max-w-3xl py-16 sm:py-24">
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: project.title },
        ]}
      />

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

      {project.install ? (
        <div className="mt-10">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Install
          </h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code className="font-mono text-foreground/90">
              {project.install}
            </code>
          </pre>
        </div>
      ) : null}

      <div className="mt-12 border-t border-border/60 pt-8">
        {hasActions ? (
          <div className="flex flex-wrap items-center gap-3">
            {project.href ? (
              <Link
                href={project.href}
                className={cn(buttonVariants({ size: "lg" }), "h-10 px-5")}
              >
                Try it live
                <ArrowRight />
              </Link>
            ) : null}
            {hasLinks
              ? project.links!.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }), "h-10")}
                  >
                    {link.label}
                    <ArrowUpRight />
                  </a>
                ))
              : null}
            {project.sourceHref ? (
              <a
                href={project.sourceHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "h-10")}
              >
                <GithubIcon />
                View source
              </a>
            ) : null}
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
