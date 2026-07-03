import { cn } from "@/lib/utils";

/** Dependency-free line chart with labeled x (date) and y (value) axes. */
export function LineChart({
  values,
  dates,
  className,
}: {
  values: number[];
  dates?: string[];
  className?: string;
}) {
  if (values.length < 2) return null;

  const W = 320;
  const H = 132;
  const padL = 34;
  const padR = 8;
  const padT = 8;
  const padB = 18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xAt = (i: number) => padL + (i / (values.length - 1)) * plotW;
  const yAt = (v: number) => padT + (1 - (v - min) / range) * plotH;

  const line = values
    .map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    .join(" ");
  const rising = values[values.length - 1] >= values[0];
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const yTicks = [max, (max + min) / 2, min];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("w-full", className)}
      role="img"
      aria-label="line chart"
    >
      {/* y-axis gridlines + labels */}
      {yTicks.map((t, i) => {
        const y = yAt(t);
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              className="stroke-border/40"
              strokeWidth={0.5}
            />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {fmt(t)}
            </text>
          </g>
        );
      })}

      {/* series line */}
      <polyline
        points={line}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className={rising ? "stroke-emerald-500" : "stroke-red-500"}
      />

      {/* x-axis date labels (start / end) */}
      {dates && dates.length >= 2 ? (
        <>
          <text
            x={padL}
            y={H - 5}
            textAnchor="start"
            className="fill-muted-foreground text-[9px]"
          >
            {dates[0].slice(0, 7)}
          </text>
          <text
            x={W - padR}
            y={H - 5}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {dates[dates.length - 1].slice(0, 7)}
          </text>
        </>
      ) : null}
    </svg>
  );
}
