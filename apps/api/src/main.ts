import "dotenv/config";
import "reflect-metadata";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Routes are served under /api (e.g. /api/health, /api/items), except the MCP
  // endpoints, which live at the clean /mcp/* so external clients get tidy URLs.
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "mcp/finance", method: RequestMethod.ALL },
      { path: "mcp/ask", method: RequestMethod.ALL },
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: allow only the configured browser origin(s).
  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`API listening on :${port} (origins: ${origins.join(", ")})`);
}

void bootstrap();
