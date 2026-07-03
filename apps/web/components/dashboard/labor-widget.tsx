import type { SeriesLatest } from "@repo/shared";

import { Sparkline } from "@/components/dashboard/sparkline";
import { StatRow, WidgetCard } from "@/components/dashboard/widget-card";
import { bySeriesId, fmtNum } from "@/components/dashboard/helpers";

export function LaborWidget({ series }: { series: SeriesLatest[] }) {
  const un = bySeriesId(series, "UNRATE");
  const pay = bySeriesId(series, "PAYEMS");
  const payChange =
    pay?.latest?.value != null && pay?.previous?.value != null
      ? pay.latest.value - pay.previous.value
      : null;

  return (
    <WidgetCard title="Labor Market" subtitle="monthly">
      <StatRow
        label="Unemployment"
        value={un?.latest?.value != null ? `${fmtNum(un.latest.value)}%` : "—"}
      />
      {un ? <Sparkline data={un.spark} /> : null}
      <StatRow
        label="Payrolls Δ (mo)"
        value={
          payChange != null
            ? `${payChange > 0 ? "+" : ""}${fmtNum(payChange, 0)}k`
            : "—"
        }
        accent={payChange == null ? undefined : payChange > 0 ? "up" : "down"}
      />
    </WidgetCard>
  );
}
