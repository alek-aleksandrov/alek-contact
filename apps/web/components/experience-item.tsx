import type { Experience } from "@repo/shared";

export function ExperienceItem({ item }: { item: Experience }) {
  return (
    <div className="grid gap-2 border-l border-border/60 pl-6 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:border-l-0 sm:pl-0">
      <div className="text-sm text-muted-foreground">
        <p className="font-mono">
          {item.start} — {item.end}
        </p>
        {item.location ? <p className="mt-1">{item.location}</p> : null}
      </div>

      <div>
        <h3 className="font-heading font-medium">{item.role}</h3>
        <p className="text-sm text-muted-foreground">{item.company}</p>
        <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted-foreground marker:text-foreground/30">
          {item.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tech.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
