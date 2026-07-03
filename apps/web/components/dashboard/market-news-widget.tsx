import type { NewsArticle } from "@repo/shared";

import { WidgetCard } from "@/components/dashboard/widget-card";

export function MarketNewsWidget({ articles }: { articles: NewsArticle[] }) {
  return (
    <WidgetCard
      title="Market News"
      subtitle="headlines"
      className="col-span-full"
    >
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">
          No headlines available right now.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {articles.slice(0, 6).map((a) => (
            <li
              key={a.url}
              className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-foreground/90 hover:text-foreground hover:underline"
              >
                {a.title}
              </a>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60">
                {a.source} · {a.publishedAt.slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
