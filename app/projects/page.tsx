import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Full-stack projects — shipped and in progress.",
};

export default function ProjectsPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Portfolio"
        title="Projects"
        description="Things I've shipped and things I'm actively building. Each links to a detail page."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 0.05}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
