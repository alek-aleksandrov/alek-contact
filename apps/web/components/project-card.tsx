import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project, ProjectStatus } from "@/content/projects";

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  "in-progress": "In progress",
  planned: "Coming soon",
};

export const statusVariant: Record<
  ProjectStatus,
  "default" | "secondary" | "outline"
> = {
  live: "default",
  "in-progress": "secondary",
  planned: "outline",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={project.href ?? `/projects/${project.slug}`}
      className="group block h-full"
    >
      <Card className="h-full transition-all group-hover:ring-foreground/25">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant={statusVariant[project.status]}>
              {statusLabel[project.status]}
            </Badge>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <CardTitle className="mt-2 text-lg">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <p className="text-sm text-muted-foreground">{project.tagline}</p>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {project.stack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
