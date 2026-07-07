import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { ItemsModule } from "./items/items.module";
import { FredModule } from "./fred/fred.module";
import { MarketModule } from "./market/market.module";
import { FinanceModule } from "./finance/finance.module";
import { McpModule } from "./mcp/mcp.module";
import { JobsModule } from "./jobs/jobs.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    ItemsModule,
    FredModule,
    MarketModule,
    FinanceModule,
    McpModule,
    JobsModule,
  ],
})
export class AppModule {}
