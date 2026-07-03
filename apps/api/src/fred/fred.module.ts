import { Module } from "@nestjs/common";

import { FredClient } from "./fred.client";
import { FredIngestService } from "./fred.ingest.service";

// PrismaModule is @Global, so it's available without importing here.
@Module({
  providers: [FredClient, FredIngestService],
  exports: [FredIngestService, FredClient],
})
export class FredModule {}
