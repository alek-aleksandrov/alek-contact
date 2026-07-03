import { Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAskMcp } from "./ask.mcp";
import { handleMcpRequest } from "./mcp-transport";

/** Streamable-HTTP "Ask About Alek" MCP endpoint, at /mcp/ask. */
@Controller("mcp/ask")
export class AskMcpController {
  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const server = new McpServer({
      name: "ask-about-alek",
      version: "1.0.0",
    });
    registerAskMcp(server);
    await handleMcpRequest(server, req, res);
  }
}
