import { Module } from "@nestjs/common";

import { FinnhubNewsClient } from "./finnhub-news.client";
import { MarketauxClient } from "./marketaux.client";
import { NewsService } from "./news.service";

@Module({
  providers: [MarketauxClient, FinnhubNewsClient, NewsService],
  exports: [NewsService],
})
export class NewsModule {}
