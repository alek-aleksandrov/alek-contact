import type { Metadata } from "next";

import { ExperienceItem } from "@/components/experience-item";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { SocialLinks } from "@/components/social-links";
import { bio, experience, skills } from "@/content/experience";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.fullName} — ${site.role}.`,
};

export default function AboutPage() {
  return (
    <>
      <Section>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          About
        </p>
        <h1 className="font-heading mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {site.fullName}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
          {bio}
        </p>
        <SocialLinks className="mt-8" />
      </Section>

      <Section className="border-t border-border/60">
        <SectionHeading eyebrow="Career" title="Experience" />
        <div className="mt-12 space-y-12">
          {experience.map((item) => (
            <Reveal key={`${item.company}-${item.role}`}>
              <ExperienceItem item={item} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border/60">
        <SectionHeading eyebrow="Toolkit" title="Skills" />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group) => (
            <div key={group.group}>
              <h3 className="font-heading text-sm font-medium">{group.group}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
