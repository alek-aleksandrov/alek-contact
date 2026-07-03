import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumb } from "@/components/breadcrumb";
import { Section } from "@/components/section";
import { FloatingConsole } from "@/components/console/floating-console";
import { GrowthWidget } from "@/components/dashboard/growth-widget";
import { HorizonProvider } from "@/components/dashboard/horizon-context";
import { HorizonToggle } from "@/components/dashboard/horizon-toggle";
import { InflationWidget } from "@/components/dashboard/inflation-widget";
import { LaborWidget } from "@/components/dashboard/labor-widget";
import { MarketNewsWidget } from "@/components/dashboard/market-news-widget";
import { MortgageWidget } from "@/components/dashboard/mortgage-widget";
import { RatesWidget } from "@/components/dashboard/rates-widget";
import { WatchlistWidget } from "@/components/dashboard/watchlist-widget";
import { getSnapshot, searchNews } from "@/lib/finance/api";

// Reads live data from the Nest API per request (cached 60s at the fetch layer),
// so the Vercel build never depends on the API being reachable.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description:
    "Ask an AI about today's macro + market data — Fed rates, inflation, labor, growth, a live equity watchlist, and market news.",
};

export default async function FinancePage() {
  // News failure must never break the dashboard (NewsAPI free tier is flaky).
  const [{ series, quotes, asOf }, news] = await Promise.all([
    getSnapshot(),
    searchNews().catch(() => []),
  ]);
  const asOfLabel = new Date(asOf).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Section>
      <Breadcrumb
        items={[
          { label: "Projects", href: "/projects" },
          { label: "Financial Dashboard" },
        ]}
      />
      {/* Hero */}
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Financial Dashboard
      </p>
      <h1 className="font-heading mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        The market, at a glance.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        Macro indicators from the Federal Reserve (FRED), a live equity watchlist,
        and market news — with an AI console that answers straight from the live
        numbers. Data as of {asOfLabel} ET.
      </p>
      <Link
        href="/projects/financial-dashboard"
        className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        how it&apos;s built
        <ArrowRight className="size-3.5" />
      </Link>

      {/* Live data — full-width, the prominent focus. Chat floats (below). */}
      <HorizonProvider>
        <div className="mt-10 flex items-center justify-between gap-4">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Live data
          </h2>
          <HorizonToggle />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RatesWidget series={series} />
          <InflationWidget series={series} />
          <LaborWidget series={series} />
          <GrowthWidget series={series} />
          <MortgageWidget series={series} />
          <WatchlistWidget initial={quotes} />
          <MarketNewsWidget articles={news} />
        </div>
      </HorizonProvider>

      <p className="mt-10 max-w-2xl text-xs text-muted-foreground/70">
        This product uses the FRED® API but is not endorsed or certified by the
        Federal Reserve Bank of St. Louis. Equity quotes via Finnhub. Not
        investment advice.
      </p>

      {/* Chat — floats over the corner, out of the content flow */}
      <FloatingConsole
        endpoint="/api/ask-finance"
        title="ask-the-dashboard"
        bootLog={[
          "booting financial-dashboard…",
          "✓ ready — ask about the data",
        ]}
        suggestions={[
          "Is the yield curve inverted?",
          "What's inflation doing?",
          "Today's movers?",
          "Any market headlines?",
        ]}
      />
    </Section>
  );
}
