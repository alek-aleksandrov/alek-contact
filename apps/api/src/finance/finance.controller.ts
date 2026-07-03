import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";

import { NewsService } from "../news/news.service";
import { FinanceService } from "./finance.service";
import { LiveService } from "./live.service";

@Controller("finance")
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly live: LiveService,
    private readonly news: NewsService,
  ) {}

  @Get("snapshot")
  @Header("Cache-Control", "public, max-age=60")
  snapshot() {
    return this.finance.getSnapshot();
  }

  @Get("series")
  @Header("Cache-Control", "public, max-age=60")
  series() {
    return this.finance.getSeriesLatest();
  }

  @Get("series/:id/observations")
  @Header("Cache-Control", "public, max-age=60")
  observations(
    @Param("id") id: string,
    @Query("limit") limit?: string,
    @Query("from") from?: string,
    @Query("sample") sample?: string,
  ) {
    return this.finance.getObservations(id, {
      limit: limit ? Number(limit) : undefined,
      from: from ? new Date(from) : undefined,
      maxPoints: sample ? Number(sample) : undefined,
    });
  }

  @Get("quotes")
  @Header("Cache-Control", "public, max-age=60")
  quotes() {
    return this.finance.getQuotes();
  }

  // ---- Live, on-demand lookups (any ticker / series) -----------------------

  @Get("quote/:symbol")
  @Header("Cache-Control", "public, max-age=30")
  async liveQuote(@Param("symbol") symbol: string) {
    const quote = await this.live.getLiveQuote(symbol);
    if (!quote) {
      throw new NotFoundException(
        `No live quote for "${symbol}" — it may be invalid or unsupported on the free tier.`,
      );
    }
    return quote;
  }

  @Get("indicator/:id")
  @Header("Cache-Control", "public, max-age=300")
  async liveIndicator(@Param("id") id: string) {
    const indicator = await this.live.getLiveIndicator(id);
    if (!indicator) {
      throw new NotFoundException(`No FRED series "${id}".`);
    }
    return indicator;
  }

  /** Market news search (keyword `q`), or top business headlines when `q` is omitted. */
  @Get("news")
  @Header("Cache-Control", "public, max-age=1800")
  newsSearch(@Query("q") q?: string) {
    return q && q.trim() ? this.news.search(q) : this.news.market();
  }
}
