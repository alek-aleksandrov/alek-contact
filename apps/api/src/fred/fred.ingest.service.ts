import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { PrismaService } from "../prisma/prisma.service";
import { FRED_SERIES } from "../config/series.config";
import { FredClient } from "./fred.client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class FredIngestService implements OnModuleInit {
  private readonly logger = new Logger(FredIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fred: FredClient,
  ) {}

  async onModuleInit() {
    // Self-seed a fresh DB on boot. Fire-and-forget so it never blocks startup.
    const count = await this.prisma.fredObservation.count();
    if (count === 0) {
      this.logger.log("No FRED observations — running initial ingest…");
      this.ingestAll().catch((e) =>
        this.logger.error("Initial FRED ingest failed", e as Error),
      );
    }
  }

  @Cron(process.env.FRED_CRON ?? "0 2 * * *")
  async scheduledIngest() {
    await this.ingestAll();
  }

  /**
   * Full re-fetch + upsert of every configured series. Deliberately NOT
   * incremental-by-date: FRED revises recent observations, so incremental sync
   * would silently miss revisions. Per series we delete-then-createMany the
   * observations inside a transaction (simplest correct option at this scale).
   */
  async ingestAll(): Promise<void> {
    this.logger.log(`Ingesting ${FRED_SERIES.length} FRED series…`);
    for (const def of FRED_SERIES) {
      try {
        const meta = await this.fred.getSeries(def.id);
        const obs = await this.fred.getObservations(def.id);
        const seriesData = {
          title: meta.title,
          units: meta.units,
          frequency: meta.frequency,
          seasonalAdjustment: meta.seasonalAdjustment,
          notes: meta.notes,
          category: def.category,
          lastUpdatedRemote: meta.lastUpdatedRemote,
          lastFetchedAt: new Date(),
        };
        await this.prisma.fredSeries.upsert({
          where: { id: def.id },
          create: { id: def.id, ...seriesData },
          update: seriesData,
        });
        await this.prisma.$transaction([
          this.prisma.fredObservation.deleteMany({ where: { seriesId: def.id } }),
          this.prisma.fredObservation.createMany({
            data: obs.map((o) => ({
              seriesId: def.id,
              date: o.date,
              value: o.value,
            })),
          }),
        ]);
        this.logger.log(`  ${def.id}: ${obs.length} observations`);
        await sleep(150);
      } catch (e) {
        this.logger.error(`  ${def.id}: ingest failed`, e as Error);
      }
    }
    this.logger.log("FRED ingest complete.");
  }
}
