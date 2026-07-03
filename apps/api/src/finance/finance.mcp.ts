import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { QuoteWire, SeriesLatest, Snapshot } from "@repo/shared";

import type { NewsService } from "../news/news.service";
import type { FinanceService } from "./finance.service";
import type { LiveService } from "./live.service";

export type FinanceMcpDeps = {
  finance: FinanceService;
  live: LiveService;
  news: NewsService;
};

const MARKDOWN = "text/markdown";

function fmt(v: number | null | undefined, digits = 2): string {
  return v == null
    ? "n/a"
    : v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function seriesLine(s: SeriesLatest): string {
  const date = s.latest?.date?.slice(0, 10) ?? "n/a";
  return `- **${s.label}** (\`${s.id}\`): ${fmt(s.latest?.value)} — ${s.units} _(as of ${date})_`;
}

function byCategory(series: SeriesLatest[], category: string): SeriesLatest[] {
  return series.filter((s) => s.category === category);
}

function moverLine(q: QuoteWire): string {
  const sign = q.changePercent >= 0 ? "+" : "";
  return `- **${q.symbol}**: $${fmt(q.price)} (${sign}${fmt(q.changePercent)}%)`;
}

function renderCategory(snap: Snapshot, category: string, title: string): string {
  const rows = byCategory(snap.series, category).map(seriesLine);
  return [`# ${title}`, "", ...rows, "", `_Data as of ${snap.asOf}_`].join("\n");
}

function renderWatchlist(snap: Snapshot): string {
  const sorted = [...snap.quotes].sort((a, b) => b.changePercent - a.changePercent);
  return [
    "# Watchlist — day movers",
    "",
    ...sorted.map(moverLine),
    "",
    `_Data as of ${snap.asOf}_`,
  ].join("\n");
}

function renderSnapshot(snap: Snapshot): string {
  const groups: Array<[string, string]> = [
    ["rates", "Rates"],
    ["inflation", "Inflation"],
    ["labor", "Labor"],
    ["growth", "Growth & Money"],
    ["mortgage", "Mortgage"],
    ["market", "Market context"],
  ];
  const macro = groups.flatMap(([cat, title]) => {
    const rows = byCategory(snap.series, cat).map(seriesLine);
    return rows.length ? [`## ${title}`, ...rows, ""] : [];
  });
  const movers = [...snap.quotes].sort((a, b) => b.changePercent - a.changePercent);
  const top = movers.slice(0, 5).map(moverLine);
  const bottom = movers.slice(-5).reverse().map(moverLine);
  return [
    "# Financial Dashboard — snapshot",
    "",
    ...macro,
    "## Top movers",
    ...top,
    "",
    "## Laggards",
    ...bottom,
    "",
    `_Data as of ${snap.asOf}. Macro via FRED; equities via Finnhub._`,
  ].join("\n");
}

/**
 * Registers the financial-dashboard MCP surface. Unlike the old web version,
 * these read the Nest services DIRECTLY (no web→API HTTP hop).
 */
export function registerFinanceMcp(server: McpServer, deps: FinanceMcpDeps): void {
  const { finance, live, news } = deps;

  const resources: Array<{
    name: string;
    uri: string;
    title: string;
    description: string;
    render: (snap: Snapshot) => string;
  }> = [
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
      render: (s) => renderCategory(s, "rates", "Rates & Yield Curve"),
    },
    {
      name: "finance-inflation",
      uri: "finance://macro/inflation",
      title: "Inflation",
      description: "CPI, Core CPI, and PCE price index levels.",
      render: (s) => renderCategory(s, "inflation", "Inflation"),
    },
    {
      name: "finance-labor",
      uri: "finance://macro/labor",
      title: "Labor Market",
      description: "Unemployment rate and nonfarm payrolls.",
      render: (s) => renderCategory(s, "labor", "Labor Market"),
    },
    {
      name: "finance-watchlist",
      uri: "finance://market/watchlist",
      title: "Watchlist",
      description: "The equity watchlist, sorted by day % change (movers).",
      render: renderWatchlist,
    },
  ];

  for (const r of resources) {
    server.registerResource(
      r.name,
      r.uri,
      { title: r.title, description: r.description, mimeType: MARKDOWN },
      async (uri) => ({
        contents: [
          { uri: uri.href, mimeType: MARKDOWN, text: r.render(await finance.getSnapshot()) },
        ],
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
    async () => ({
      content: [{ type: "text", text: renderSnapshot(await finance.getSnapshot()) }],
    }),
  );

  server.registerTool(
    "get_series",
    {
      title: "Get Series Observations",
      description:
        "Recent observations for one FRED series in the dashboard's cached set (e.g. UNRATE, DGS10, CPIAUCSL).",
      inputSchema: {
        series_id: z.string().min(1).describe('FRED series id, e.g. "UNRATE".'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ series_id }) => {
      const { observations } = await finance.getObservations(series_id, { limit: 60 });
      if (observations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No cached observations for "${series_id}". Try get_indicator for a live lookup of any series.`,
            },
          ],
        };
      }
      const rows = observations.map((o) => `- ${o.date.slice(0, 10)}: ${fmt(o.value)}`);
      return {
        content: [
          {
            type: "text",
            text: [`# ${series_id} — last ${observations.length} observations`, "", ...rows].join("\n"),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_quote",
    {
      title: "Get Quote",
      description:
        "Live quote for ANY US equity ticker (e.g. AAPL, TSLA, DIS) — not just the watchlist.",
      inputSchema: {
        symbol: z.string().min(1).describe('Ticker symbol, e.g. "AAPL".'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ symbol }) => {
      const q = await live.getLiveQuote(symbol);
      if (!q) {
        return {
          content: [
            { type: "text", text: `No live quote for "${symbol}" — it may be invalid or unsupported.` },
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
        "Live latest value of ANY FRED economic series by id (e.g. MORTGAGE30US, DGS10, GDPC1, DEXUSEU).",
      inputSchema: {
        series_id: z.string().min(1).describe('FRED series id, e.g. "MORTGAGE30US".'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ series_id }) => {
      const ind = await live.getLiveIndicator(series_id);
      if (!ind) {
        return {
          content: [{ type: "text", text: `No FRED series "${series_id}".` }],
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
        "Search recent market/financial news by keyword (e.g. \"Nvidia earnings\"). Omit the query for top business headlines.",
      inputSchema: {
        query: z.string().optional().describe("Keyword(s); omit for top headlines."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query }) => {
      const articles =
        query && query.trim() ? await news.search(query) : await news.market();
      if (articles.length === 0) {
        return {
          content: [
            { type: "text", text: query ? `No recent news for "${query}".` : "No market headlines right now." },
          ],
        };
      }
      const md = articles
        .slice(0, 8)
        .map((a) => `- **${a.title}** — ${a.source} (${a.publishedAt.slice(0, 10)})\n  ${a.url}`)
        .join("\n");
      const heading = query ? `News matching "${query}"` : "Top market news";
      return { content: [{ type: "text", text: `# ${heading}\n\n${md}` }] };
    },
  );

  server.registerTool(
    "list_movers",
    {
      title: "List Movers",
      description: "The biggest day movers on the watchlist, largest % gain first.",
      inputSchema: {
        limit: z.number().int().min(1).max(20).optional().describe("How many (default 5)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ limit }) => {
      const quotes = await finance.getQuotes();
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
