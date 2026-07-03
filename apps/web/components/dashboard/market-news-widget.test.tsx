import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { NewsArticle } from "@repo/shared";

import { MarketNewsWidget } from "./market-news-widget";

function article(over: Partial<NewsArticle> = {}): NewsArticle {
  return {
    title: "Headline",
    source: "yahoo",
    url: "https://x.com",
    publishedAt: "2026-07-03T00:00:00Z",
    summary: null,
    sentiment: null,
    ...over,
  };
}

describe("MarketNewsWidget", () => {
  it("shows an empty state when there are no articles", () => {
    render(<MarketNewsWidget articles={[]} />);
    expect(screen.getByText(/No headlines available/i)).toBeInTheDocument();
  });

  it("renders each headline as a link to its url", () => {
    render(
      <MarketNewsWidget
        articles={[article({ title: "Big News", url: "https://news.test/a" })]}
      />,
    );
    const link = screen.getByRole("link", { name: "Big News" });
    expect(link).toHaveAttribute("href", "https://news.test/a");
  });

  it("shows a bullish tag for score > 0.15", () => {
    render(<MarketNewsWidget articles={[article({ sentiment: 0.44 })]} />);
    expect(screen.getByText(/▲\s*\+0\.44/)).toBeInTheDocument();
  });

  it("shows a bearish tag for score < -0.15", () => {
    render(<MarketNewsWidget articles={[article({ sentiment: -0.44 })]} />);
    expect(screen.getByText(/▼\s*-0\.44/)).toBeInTheDocument();
  });

  it("renders no sentiment tag when the score is null", () => {
    render(<MarketNewsWidget articles={[article({ sentiment: null })]} />);
    expect(screen.queryByText(/[▲▼▬]/)).toBeNull();
  });
});
