import { Module } from "@nestjs/common";

import { MarketauxClient } from "./marketaux.client";
import { NewsService } from "./news.service";

@Module({
  providers: [MarketauxClient, NewsService],
  exports: [NewsService],
})
export class NewsModule {}
