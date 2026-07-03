import type { IncomingMessage, ServerResponse } from "node:http";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * Handle one stateless MCP request against a fresh server + transport — the
 * "no session" streamable-HTTP pattern (equivalent to the old Next mcp-handler
 * with disableSse). The transport speaks Node req/res, and Express's Request /
 * Response extend those, so this drops straight into a Nest controller.
 */
export async function handleMcpRequest(
  server: McpServer,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  // MCP clients call from anywhere; the payload is public, read-only data.
  res.setHeader("Access-Control-Allow-Origin", "*");

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
