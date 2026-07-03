import type { Metadata } from "next";

import { Section } from "@/components/section";
import { AskConsole } from "@/components/console/ask-console";
import { GrowthWidget } from "@/components/dashboard/growth-widget";
import { InflationWidget } from "@/components/dashboard/inflation-widget";
import { LaborWidget } from "@/components/dashboard/labor-widget";
import { MortgageWidget } from "@/components/dashboard/mortgage-widget";
import { RatesWidget } from "@/components/dashboard/rates-widget";
import { WatchlistWidget } from "@/components/dashboard/watchlist-widget";
import { getSnapshot } from "@/lib/finance/api";

// Reads live data from the Nest API per request (cached 60s at the fetch layer),
// so the Vercel build never depends on the API being reachable.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description:
    "A glanceable macro + market dashboard — Fed rates, inflation, labor, growth, and a live equity watchlist.",
};

export default async function FinancePage() {
  const { series, quotes, asOf } = await getSnapshot();
  const asOfLabel = new Date(asOf).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Section>
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Financial Dashboard
      </p>
      <h1 className="font-heading mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        The market data I check every day.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        Macro indicators from the Federal Reserve (FRED) and a live equity
        watchlist, cached server-side. Data as of {asOfLabel} ET.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RatesWidget series={series} />
        <InflationWidget series={series} />
        <LaborWidget series={series} />
        <GrowthWidget series={series} />
        <MortgageWidget series={series} />
        <WatchlistWidget initial={quotes} />
      </div>

      {/* Ask-the-dashboard console — grounded in the live snapshot above */}
      <div className="mt-14">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Ask the dashboard
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ask about today&apos;s numbers in plain English — it answers only from
          the live data above.
        </p>
        <div className="mt-5 max-w-2xl">
          <AskConsole
            endpoint="/api/ask-finance"
            title="ask-the-dashboard"
            bootLog={[
              "booting financial-dashboard…",
              "✓ ready — ask me about today's macro + market data",
            ]}
            suggestions={[
              "Is the yield curve inverted?",
              "What's inflation doing?",
              "Who are today's movers?",
              "Summarize the macro picture",
            ]}
          />
        </div>
      </div>

      <p className="mt-10 max-w-2xl text-xs text-muted-foreground/70">
        This product uses the FRED® API but is not endorsed or certified by the
        Federal Reserve Bank of St. Louis. Equity quotes via Finnhub. Not
        investment advice.
      </p>
    </Section>
  );
}
