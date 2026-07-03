import type { NewsArticle } from "@repo/shared";

import { WidgetCard } from "@/components/dashboard/widget-card";
import { cn } from "@/lib/utils";

/** Small bullish/bearish/neutral tag driven by the article's sentiment score. */
function SentimentTag({ score }: { score: number | null }) {
  if (score === null) return null;
  const tone =
    score > 0.15 ? "bullish" : score < -0.15 ? "bearish" : "neutral";
  const arrow = tone === "bullish" ? "▲" : tone === "bearish" ? "▼" : "▬";
  return (
    <span
      title={`Sentiment ${score > 0 ? "+" : ""}${score}`}
      className={cn(
        "font-mono text-[11px] tabular-nums",
        tone === "bullish" && "text-emerald-500",
        tone === "bearish" && "text-red-500",
        tone === "neutral" && "text-muted-foreground/60",
      )}
    >
      {arrow} {score > 0 ? "+" : ""}
      {score.toFixed(2)}
    </span>
  );
}

export function MarketNewsWidget({ articles }: { articles: NewsArticle[] }) {
  return (
    <WidgetCard
      title="Market News"
      subtitle="headlines · sentiment"
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
              <span className="flex shrink-0 items-baseline gap-2">
                <SentimentTag score={a.sentiment} />
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  {a.source} · {a.publishedAt.slice(0, 10)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
