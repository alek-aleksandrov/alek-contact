import type { SeriesLatest } from "@repo/shared";

import { StatRow, WidgetCard } from "@/components/dashboard/widget-card";
import { bySeriesId, fmtNum, yoy } from "@/components/dashboard/helpers";

const ROWS: Array<[string, string]> = [
  ["CPIAUCSL", "CPI"],
  ["CPILFESL", "Core CPI"],
  ["PCEPI", "PCE"],
];

export function InflationWidget({ series }: { series: SeriesLatest[] }) {
  return (
    <WidgetCard title="Inflation" subtitle="YoY vs 2% target">
      {ROWS.map(([id, label]) => {
        const s = bySeriesId(series, id);
        const y = s ? yoy(s.spark) : null;
        return (
          <StatRow
            key={id}
            label={label}
            value={y != null ? `${fmtNum(y)}%` : "—"}
            hint="YoY"
            accent={y == null ? undefined : y > 2.5 ? "down" : y <= 2 ? "up" : "flag"}
          />
        );
      })}
    </WidgetCard>
  );
}
