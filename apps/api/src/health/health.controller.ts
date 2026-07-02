import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let db = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "unreachable";
    }
    return { status: "ok", db, timestamp: new Date().toISOString() };
  }

  // Temporary diagnostic — reports config + whether the Item table exists,
  // without exposing any secret. Safe to delete once deploy is confirmed.
  @Get("db")
  async db() {
    const raw = process.env.DATABASE_URL ?? "";
    let host = "unparsable";
    let pooled = false;
    let pgbouncer = false;
    try {
      const u = new URL(raw);
      host = u.hostname;
      pooled = host.includes("-pooler");
      pgbouncer = u.searchParams.get("pgbouncer") === "true";
    } catch {
      /* ignore */
    }

    let itemTableExists: boolean | null = null;
    let itemQueryError: string | null = null;
    try {
      const rows = await this.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'Item'
        ) AS exists`;
      itemTableExists = rows[0]?.exists ?? false;
    } catch (e) {
      itemQueryError = e instanceof Error ? e.message : String(e);
    }

    let itemCount: number | null = null;
    let itemModelError: string | null = null;
    try {
      itemCount = await this.prisma.item.count();
    } catch (e) {
      itemModelError = e instanceof Error ? e.message : String(e);
    }

    return {
      databaseHost: host,
      pooled,
      pgbouncerFlag: pgbouncer,
      directUrlSet: Boolean(process.env.DIRECT_URL),
      webOrigin: process.env.WEB_ORIGIN ?? null,
      itemTableExists,
      itemQueryError,
      itemCount,
      itemModelError,
    };
  }
}
