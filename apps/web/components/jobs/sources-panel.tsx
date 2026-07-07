import { SOURCE_LABELS, type JobCitation } from "@repo/shared";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}

export function SourcesPanel({ citations }: { citations: JobCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Retrieved postings
      </h3>
      <ul className="mt-3 space-y-2">
        {citations.map((c, i) => (
          <li
            key={c.id}
            className="animate-in fade-in slide-in-from-bottom-1"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border/60 p-3 hover:border-border"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-muted font-mono text-xs">
                  {c.company.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{c.company}</span>{" "}
                  <span className="text-sm text-muted-foreground">{c.title}</span>
                </span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {SOURCE_LABELS[c.source]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {c.workplace ? <Chip>{c.workplace}</Chip> : null}
                {c.salary ? <Chip>{c.salary}</Chip> : null}
                {c.department ? <Chip>{c.department}</Chip> : null}
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="h-1 w-16 overflow-hidden rounded bg-muted">
                    <span
                      className="block h-full bg-foreground/40"
                      style={{ width: `${Math.round(c.score * 100)}%` }}
                    />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {Math.round(c.score * 100)}%
                  </span>
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
