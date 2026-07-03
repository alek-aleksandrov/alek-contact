import type { Metadata } from "next";

import { ExperienceItem } from "@/components/experience-item";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { SocialLinks } from "@/components/social-links";
import {
  bio,
  education,
  experience,
  languages,
  recommendations,
  skills,
} from "@repo/shared";
import { site } from "@repo/shared";

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
        <SectionHeading eyebrow="Kind words" title="Recommendations" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {recommendations.map((rec) => (
            <Reveal key={rec.name}>
              <figure className="h-full rounded-xl border border-border/60 p-6">
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{rec.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4">
                  <span className="text-sm font-medium">{rec.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    — {rec.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-foreground/70">
                    {rec.relationship}
                  </span>
                </figcaption>
              </figure>
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

      <Section className="border-t border-border/60">
        <SectionHeading eyebrow="Background" title="Education" />
        <div className="mt-10 space-y-5">
          {education.map((e) => (
            <div
              key={e.school}
              className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6"
            >
              <p className="font-mono text-sm text-muted-foreground">
                {e.start} – {e.end}
              </p>
              <div>
                <p className="font-heading font-medium">{e.school}</p>
                <p className="text-sm text-muted-foreground">{e.credential}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Languages
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {languages.map((l) => (
              <span
                key={l.name}
                className="rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground"
              >
                {l.name} · {l.proficiency}
              </span>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
