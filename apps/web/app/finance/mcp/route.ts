/**
 * Financial-dashboard MCP endpoint. Same stateless streamable-HTTP setup as the
 * "Ask About Alek" server (`app/mcp/route.ts`), exposing live macro + market
 * data as read-only resources and tools.
 */

import { createMcpHandler } from "mcp-handler";

import { registerFinance } from "@/lib/mcp/finance-server";

const handler = createMcpHandler(
  (server) => registerFinance(server),
  { serverInfo: { name: "financial-dashboard", version: "1.0.0" } },
  // basePath must match this route's mount ("/finance") so the handler routes
  // "/finance/mcp" correctly (mcp-handler matches basePath + streamableHttpEndpoint).
  { disableSse: true, basePath: "/finance" },
);

export { handler as GET, handler as POST };
