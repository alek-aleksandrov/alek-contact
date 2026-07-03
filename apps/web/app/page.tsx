import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/hero";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { Container, Section, SectionHeading } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { featuredProjects } from "@repo/shared";
import { experience } from "@repo/shared";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <Container>
        <Hero />
      </Container>

      <Section className="border-t border-border/60">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Selected work"
            title="Projects"
            description="Full-stack apps I'm building to show what I ship."
          />
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden shrink-0 sm:inline-flex",
            )}
          >
            All projects
            <ArrowRight />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.05}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border/60">
        <SectionHeading
          eyebrow="Background"
          title="Experience"
          description="A snapshot — the full history lives on the about page."
        />

        <div className="mt-10 space-y-6">
          {experience.slice(0, 2).map((item) => (
            <Reveal key={`${item.company}-${item.role}`}>
              <div>
                <p className="font-heading font-medium">
                  {item.role}{" "}
                  <span className="text-muted-foreground">· {item.company}</span>
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  {item.start} — {item.end}
                </p>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {item.summary}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/about"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            More about me
            <ArrowRight />
          </Link>
        </div>
      </Section>
    </>
  );
}
