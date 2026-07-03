import type { SeriesLatest } from "@repo/shared";

import { HorizonChart } from "@/components/dashboard/horizon-chart";
import { StatRow, WidgetCard } from "@/components/dashboard/widget-card";
import { bySeriesId, fmtNum } from "@/components/dashboard/helpers";

export function MortgageWidget({ series }: { series: SeriesLatest[] }) {
  const m = bySeriesId(series, "MORTGAGE30US");
  return (
    <WidgetCard title="Mortgage Rates" subtitle="30-yr fixed">
      <StatRow
        label="30-year fixed"
        value={m?.latest?.value != null ? `${fmtNum(m.latest.value)}%` : "—"}
      />
      {m ? (
        <div className="mt-1">
          <HorizonChart seriesId="MORTGAGE30US" initial={m.spark} />
        </div>
      ) : null}
    </WidgetCard>
  );
}
