import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { ItemsModule } from "./items/items.module";

@Module({
  imports: [PrismaModule, HealthModule, ItemsModule],
})
export class AppModule {}
