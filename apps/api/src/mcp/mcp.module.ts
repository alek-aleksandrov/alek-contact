import { Module } from "@nestjs/common";

import { AskMcpController } from "./ask-mcp.controller";

/** Hosts the "Ask About Alek" MCP endpoint. (Finance MCP lives in FinanceModule.) */
@Module({
  controllers: [AskMcpController],
})
export class McpModule {}
