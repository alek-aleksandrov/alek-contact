import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { JobsController } from "./jobs.controller";
import { JobRagService } from "./job-rag.service";
import { JobIngestService } from "./job-ingest.service";
import { RefreshGuard } from "./refresh-guard";

@Module({
  imports: [PrismaModule],
  controllers: [JobsController],
  providers: [
    // Both services take a single optional `Deps` object (for unit-test
    // injection), which Nest would otherwise try to resolve as a DI token and
    // fail on. Construct them via factory providers instead.
    {
      provide: JobRagService,
      useFactory: () => new JobRagService(),
    },
    {
      provide: JobIngestService,
      useFactory: (prisma: PrismaService, guard: RefreshGuard) =>
        new JobIngestService({ prisma, guard }),
      inject: [PrismaService, RefreshGuard],
    },
    {
      provide: RefreshGuard,
      useFactory: () => new RefreshGuard({ cooldownMs: 60_000, now: () => Date.now() }),
    },
  ],
})
export class JobsModule {}
