import { Module } from "@nestjs/common";

import { FredModule } from "../fred/fred.module";
import { MarketModule } from "../market/market.module";
import { NewsModule } from "../news/news.module";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { LiveService } from "./live.service";

@Module({
  imports: [MarketModule, FredModule, NewsModule],
  controllers: [FinanceController],
  providers: [FinanceService, LiveService],
})
export class FinanceModule {}
