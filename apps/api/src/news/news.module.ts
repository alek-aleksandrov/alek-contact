import { Module } from "@nestjs/common";

import { NewsApiClient } from "./news.client";
import { NewsService } from "./news.service";

@Module({
  providers: [NewsApiClient, NewsService],
  exports: [NewsService],
})
export class NewsModule {}
