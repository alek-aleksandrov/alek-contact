"use client";

import { useEffect, useState } from "react";

import type { QuoteWire } from "@repo/shared";

import { WidgetCard } from "@/components/dashboard/widget-card";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Mon-Fri 09:30-16:00 America/New_York (mirrors the server-side poller gate). */
function isUsMarketOpen(): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = get("weekday");
  if (wd === "Sat" || wd === "Sun") return false;
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

export function WatchlistWidget({ initial }: { initial: QuoteWire[] }) {
  const [quotes, setQuotes] = useState<QuoteWire[]>(initial);

  // Seeded from the server snapshot; refreshes client-side every 60s while the
  // US market is open, then stops off-hours (quota hygiene).
  useEffect(() => {
    async function tick() {
      try {
        const res = await fetch(`${API_URL}/api/finance/quotes`);
        if (res.ok) setQuotes(await res.json());
      } catch {
        /* keep last-known quotes */
      }
    }
    const id = setInterval(() => {
      if (isUsMarketOpen()) void tick();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

  return (
    <WidgetCard title="Watchlist" subtitle="day movers">
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        {sorted.map((q) => (
          <div
            key={q.symbol}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="font-mono text-sm">{q.symbol}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                ${q.price.toFixed(2)}
              </span>
              <span
                className={cn(
                  "w-16 text-right font-mono text-xs tabular-nums",
                  q.changePercent >= 0 ? "text-emerald-500" : "text-red-500",
                )}
              >
                {q.changePercent >= 0 ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
