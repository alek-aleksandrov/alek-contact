import { Module } from "@nestjs/common";

import { FinnhubClient } from "./finnhub.client";
import { MarketPollService } from "./market.poll.service";

@Module({
  providers: [FinnhubClient, MarketPollService],
  exports: [FinnhubClient],
})
export class MarketModule {}
