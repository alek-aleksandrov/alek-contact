import { Controller, Get, Header, Param, Query } from "@nestjs/common";

import { FinanceService } from "./finance.service";

@Controller("finance")
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

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
  observations(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.finance.getObservations(id, limit ? Number(limit) : undefined);
  }

  @Get("quotes")
  @Header("Cache-Control", "public, max-age=60")
  quotes() {
    return this.finance.getQuotes();
  }
}
