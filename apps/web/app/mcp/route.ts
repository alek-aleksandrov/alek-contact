/**
 * "Ask About Alek" MCP endpoint.
 *
 * Streamable HTTP, stateless (no sessions, no Redis). Public, read-only,
 * keyless — no server-side LLM, no secrets, no DB. Deploys with the portfolio.
 */

import { createMcpHandler } from "mcp-handler";

import { registerAll } from "@/lib/mcp/server";

// Stateless streamable HTTP: no redisUrl, no sessionIdGenerator. SSE (which
// would require Redis) is disabled — this endpoint is POST-only JSON-RPC.
const handler = createMcpHandler(
  (server) => registerAll(server),
  {
    serverInfo: { name: "ask-about-alek", version: "1.0.0" },
  },
  { disableSse: true },
);

export { handler as GET, handler as POST };
