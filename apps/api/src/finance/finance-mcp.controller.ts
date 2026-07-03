import { Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { NewsService } from "../news/news.service";
import { handleMcpRequest } from "../mcp/mcp-transport";
import { FinanceService } from "./finance.service";
import { LiveService } from "./live.service";
import { registerFinanceMcp } from "./finance.mcp";

/** Streamable-HTTP MCP endpoint for the financial dashboard, at /mcp/finance. */
@Controller("mcp/finance")
export class FinanceMcpController {
  constructor(
    private readonly finance: FinanceService,
    private readonly live: LiveService,
    private readonly news: NewsService,
  ) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const server = new McpServer({
      name: "financial-dashboard",
      version: "1.0.0",
    });
    registerFinanceMcp(server, {
      finance: this.finance,
      live: this.live,
      news: this.news,
    });
    await handleMcpRequest(server, req, res);
  }
}
