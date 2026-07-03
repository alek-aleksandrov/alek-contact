import type { SeriesLatest } from "@repo/shared";

import { StatRow, WidgetCard } from "@/components/dashboard/widget-card";
import { bySeriesId, fmtNum } from "@/components/dashboard/helpers";

export function GrowthWidget({ series }: { series: SeriesLatest[] }) {
  const gdp = bySeriesId(series, "GDPC1");
  const m2 = bySeriesId(series, "M2SL");
  const sent = bySeriesId(series, "UMCSENT");
  const gdpQoQ =
    gdp?.latest?.value != null && gdp?.previous?.value != null
      ? (gdp.latest.value / gdp.previous.value - 1) * 100
      : null;

  return (
    <WidgetCard title="Growth & Money" subtitle="latest">
      <StatRow
        label="Real GDP QoQ"
        value={
          gdpQoQ != null ? `${gdpQoQ > 0 ? "+" : ""}${fmtNum(gdpQoQ)}%` : "—"
        }
        accent={gdpQoQ == null ? undefined : gdpQoQ > 0 ? "up" : "down"}
      />
      <StatRow
        label="M2 money supply"
        value={
          m2?.latest?.value != null
            ? `$${fmtNum(m2.latest.value / 1000, 1)}T`
            : "—"
        }
      />
      <StatRow
        label="Consumer sentiment"
        value={sent?.latest?.value != null ? fmtNum(sent.latest.value, 1) : "—"}
      />
    </WidgetCard>
  );
}
