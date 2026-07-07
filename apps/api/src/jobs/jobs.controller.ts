import { Body, Controller, Get, HttpCode, Logger, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import type { JobAskMeta } from "@repo/shared";
import { JobRagService } from "./job-rag.service";
import { PrismaService } from "../prisma/prisma.service";
import { JobIngestService } from "./job-ingest.service";
import { RefreshGuard } from "./refresh-guard";

@Controller("jobs")
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly rag: JobRagService,
    private readonly prisma: PrismaService,
    private readonly ingest: JobIngestService,
    private readonly guard: RefreshGuard,
  ) {}

  // Nest defaults POST handlers to 201 (RouterExecutionContext calls
  // responseController.setStatus() unconditionally before invoking the
  // handler, even when @Res() takes over the response). This endpoint
  // streams an answer rather than creating a resource, so 200 is correct.
  @Post("ask")
  @HttpCode(200)
  async ask(
    @Body() body: { question?: string },
    @Res() res: Response,
  ): Promise<void> {
    const question = (body.question ?? "").slice(0, 500);
    const { meta, stream } = await this.rag.answer(question);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    // First frame: metadata as one JSON line, then the token stream.
    res.write(JSON.stringify(meta) + "\n");
    // Headers + metadata frame are already flushed, so a mid-stream failure
    // can't become a Nest 500 — swallow it, log it, and always end() so the
    // client sees a complete (if truncated) response instead of hanging.
    try {
      for await (const token of stream) res.write(token);
    } catch (err) {
      this.logger.error("answer stream failed", err as Error);
      res.write("\n[error: answer generation failed]");
    } finally {
      res.end();
    }
  }

  // Same 200-vs-201 rationale as /ask above: this streams progress lines
  // rather than creating a resource.
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Res() res: Response): Promise<void> {
    const outcome = await this.guard.run(async () => {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      // Headers + progress lines are already flushed, so a mid-stream ingest
      // failure (external API / embedding errors are likely) can't become a
      // Nest 500 — swallow it, log it, and always end() so the client sees a
      // complete (if truncated) response instead of hanging. Catching inside
      // the guarded fn also means the guard still records a completed run for
      // the cooldown window.
      try {
        await this.ingest.ingest((line) => res.write(line + "\n"));
      } catch (err) {
        this.logger.error("refresh ingest failed", err as Error);
        res.write("\n[error: gather failed]");
      } finally {
        res.end();
      }
    });
    if (!outcome.ok) {
      const code = outcome.reason === "running" ? 409 : 429;
      res.status(code).send(
        outcome.reason === "running"
          ? "A refresh is already running."
          : "Refreshed recently; try again shortly.",
      );
    }
  }

  @Get("meta")
  async meta(): Promise<JobAskMeta> {
    const [count, latest] = await Promise.all([
      this.prisma.jobPosting.count(),
      this.prisma.jobPosting.findFirst({ orderBy: { indexedAt: "desc" } }),
    ]);
    return {
      count,
      refreshedAt: latest?.indexedAt ? latest.indexedAt.toISOString() : null,
    };
  }
}
