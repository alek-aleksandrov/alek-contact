import type { SeriesLatest } from "@repo/shared";

import { Sparkline } from "@/components/dashboard/sparkline";
import { StatRow, WidgetCard } from "@/components/dashboard/widget-card";
import { bySeriesId, fmtNum } from "@/components/dashboard/helpers";

const RATE_ROWS: Array<[string, string]> = [
  ["DFF", "Fed funds"],
  ["DGS3MO", "3-month"],
  ["DGS2", "2-year"],
  ["DGS10", "10-year"],
  ["DGS30", "30-year"],
];

export function RatesWidget({ series }: { series: SeriesLatest[] }) {
  const spread = bySeriesId(series, "T10Y2Y");
  const spreadVal = spread?.latest?.value ?? null;
  const inverted = spreadVal != null && spreadVal < 0;

  return (
    <WidgetCard title="Rates & Yield Curve" subtitle="Treasury %">
      {RATE_ROWS.map(([id, label]) => {
        const s = bySeriesId(series, id);
        const v = s?.latest?.value;
        return (
          <StatRow
            key={id}
            label={label}
            value={v != null ? `${fmtNum(v)}%` : "—"}
          />
        );
      })}
      {spread ? (
        <div className="border-t border-border/50 pt-3">
          <StatRow
            label="10Y–2Y spread"
            value={spreadVal != null ? `${fmtNum(spreadVal)}%` : "—"}
            accent={inverted ? "down" : "up"}
            hint={inverted ? "inverted" : "normal"}
          />
          <Sparkline data={spread.spark} className="mt-2" />
        </div>
      ) : null}
    </WidgetCard>
  );
}
