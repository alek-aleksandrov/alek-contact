import type { SeriesLatest } from "@repo/shared";

import { HorizonChart } from "@/components/dashboard/horizon-chart";
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
      {un ? (
        <div className="mt-1">
          <HorizonChart seriesId="UNRATE" initial={un.spark} />
        </div>
      ) : null}
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
