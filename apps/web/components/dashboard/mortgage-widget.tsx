import type { SeriesLatest } from "@repo/shared";

import { Sparkline } from "@/components/dashboard/sparkline";
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
      {m ? <Sparkline data={m.spark} /> : null}
    </WidgetCard>
  );
}
