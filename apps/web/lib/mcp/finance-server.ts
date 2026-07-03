/**
 * Wires the financial-dashboard MCP surface: read-only resources + tools over
 * the same live data the dashboard renders. Mirrors the conventions in
 * `lib/mcp/server.ts` (the "Ask About Alek" server).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  getLiveIndicator,
  getLiveQuote,
  getQuotes,
  searchNews,
} from "@/lib/finance/api";
import {
  renderInflation,
  renderLabor,
  renderRates,
  renderSeriesObservations,
  renderSnapshot,
  renderWatchlist,
} from "@/lib/mcp/finance-render";

const MARKDOWN = "text/markdown";

type ResourceDef = {
  name: string;
  uri: string;
  title: string;
  description: string;
  render: () => Promise<string>;
};

const RESOURCES: ResourceDef[] = [
  {
    name: "finance-snapshot",
    uri: "finance://snapshot",
    title: "Dashboard Snapshot",
    description: "Grouped macro indicators + top/bottom equity movers, one payload.",
    render: renderSnapshot,
  },
  {
    name: "finance-rates",
    uri: "finance://macro/rates",
    title: "Rates & Yield Curve",
    description: "Fed funds + Treasury yields and the 10Y-2Y spread.",
    render: renderRates,
  },
  {
    name: "finance-inflation",
    uri: "finance://macro/inflation",
    title: "Inflation",
    description: "CPI, Core CPI, and PCE price index levels.",
    render: renderInflation,
  },
  {
    name: "finance-labor",
    uri: "finance://macro/labor",
    title: "Labor Market",
    description: "Unemployment rate and nonfarm payrolls.",
    render: renderLabor,
  },
  {
    name: "finance-watchlist",
    uri: "finance://market/watchlist",
    title: "Watchlist",
    description: "The equity watchlist, sorted by day % change (movers).",
    render: renderWatchlist,
  },
];

export function registerFinance(server: McpServer): void {
  for (const r of RESOURCES) {
    server.registerResource(
      r.name,
      r.uri,
      { title: r.title, description: r.description, mimeType: MARKDOWN },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: MARKDOWN, text: await r.render() }],
      }),
    );
  }

  server.registerTool(
    "get_snapshot",
    {
      title: "Get Snapshot",
      description:
        "A full snapshot of the dashboard: grouped macro indicators plus top and bottom equity movers.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ({ content: [{ type: "text", text: await renderSnapshot() }] }),
  );

  server.registerTool(
    "get_series",
    {
      title: "Get Series Observations",
      description:
        "Recent observations for one FRED series (e.g. UNRATE, DGS10, CPIAUCSL).",
      inputSchema: {
        series_id: z
          .string()
          .min(1)
          .describe("FRED series id, e.g. \"UNRATE\" or \"DGS10\"."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ series_id }) => ({
      content: [{ type: "text", text: await renderSeriesObservations(series_id) }],
    }),
  );

  server.registerTool(
    "get_quote",
    {
      title: "Get Quote",
      description:
        "Live quote for ANY US equity ticker (e.g. AAPL, TSLA, DIS) — not just the watchlist.",
      inputSchema: {
        symbol: z
          .string()
          .min(1)
          .describe('Ticker symbol, e.g. "AAPL" or "TSLA".'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ symbol }) => {
      const q = await getLiveQuote(symbol);
      if (!q) {
        return {
          content: [
            {
              type: "text",
              text: `No live quote for "${symbol}" — it may be invalid or unsupported on the free tier.`,
            },
          ],
        };
      }
      const sign = q.changePercent >= 0 ? "+" : "";
      return {
        content: [
          {
            type: "text",
            text: `**${q.symbol}**: $${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%) — as of ${q.fetchedAt}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_indicator",
    {
      title: "Get Economic Indicator",
      description:
        "Live latest value of ANY FRED economic series by id (e.g. MORTGAGE30US, DGS10, GDPC1, DEXUSEU) — not just the ones on the dashboard.",
      inputSchema: {
        series_id: z
          .string()
          .min(1)
          .describe('FRED series id, e.g. "MORTGAGE30US" or "DGS10".'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ series_id }) => {
      const ind = await getLiveIndicator(series_id);
      if (!ind) {
        return {
          content: [
            {
              type: "text",
              text: `No FRED series "${series_id}". Browse ids at fred.stlouisfed.org.`,
            },
          ],
        };
      }
      const when = ind.latest ? ` — as of ${ind.latest.date.slice(0, 10)}` : "";
      return {
        content: [
          {
            type: "text",
            text: `**${ind.label}** (${ind.id}): ${ind.latest?.value ?? "n/a"} ${ind.units}${when}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "search_news",
    {
      title: "Search Market News",
      description:
        "Search recent market/financial news by keyword (e.g. \"Nvidia earnings\", \"oil prices\", \"Fed rate decision\"). Omit the query for top business headlines.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Keyword(s) to search; omit for top market headlines."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query }) => {
      const articles = await searchNews(query);
      if (articles.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: query
                ? `No recent news found for "${query}".`
                : "No market headlines available right now.",
            },
          ],
        };
      }
      const md = articles
        .slice(0, 8)
        .map(
          (a) =>
            `- **${a.title}** — ${a.source} (${a.publishedAt.slice(0, 10)})\n  ${a.url}`,
        )
        .join("\n");
      const heading = query ? `News matching “${query}”` : "Top market news";
      return { content: [{ type: "text", text: `# ${heading}\n\n${md}` }] };
    },
  );

  server.registerTool(
    "list_movers",
    {
      title: "List Movers",
      description: "The biggest day movers on the watchlist, largest % gain first.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("How many top movers to return (default 5)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ limit }) => {
      const quotes = await getQuotes();
      const sorted = [...quotes]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit ?? 5);
      const md = sorted
        .map(
          (q) =>
            `- **${q.symbol}**: ${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}% ($${q.price.toFixed(2)})`,
        )
        .join("\n");
      return { content: [{ type: "text", text: `# Top movers\n\n${md}` }] };
    },
  );
}
