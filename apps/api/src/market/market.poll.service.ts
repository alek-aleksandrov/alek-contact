import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";

import { PrismaService } from "../prisma/prisma.service";
import { WATCHLIST } from "../config/series.config";
import { FinnhubClient } from "./finnhub.client";

const POLL_SECONDS = Number(process.env.MARKET_POLL_SECONDS) || 60;

/** True Mon-Fri 09:30-16:00 America/New_York (holidays ignored — YAGNI). */
export function isUsMarketOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = get("weekday");
  if (wd === "Sat" || wd === "Sun") return false;
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

@Injectable()
export class MarketPollService implements OnModuleInit {
  private readonly logger = new Logger(MarketPollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly finnhub: FinnhubClient,
  ) {}

  async onModuleInit() {
    // Idempotent seed of the watchlist instruments.
    for (const symbol of WATCHLIST) {
      await this.prisma.instrument.upsert({
        where: { symbol },
        create: { symbol },
        update: {},
      });
    }
    // One poll on boot so the table isn't empty pre-market (fire-and-forget).
    this.pollAll().catch((e) =>
      this.logger.error("Initial market poll failed", e as Error),
    );
  }

  @Interval(POLL_SECONDS * 1000)
  async scheduledPoll() {
    if (!isUsMarketOpen()) return;
    await this.pollAll();
  }

  async pollAll(): Promise<void> {
    for (const symbol of WATCHLIST) {
      try {
        const q = await this.finnhub.getQuote(symbol);
        await this.prisma.quote.upsert({
          where: { symbol },
          create: { symbol, ...q },
          update: q,
        });
      } catch (e) {
        this.logger.error(`  ${symbol}: quote failed`, e as Error);
      }
    }
  }
}
