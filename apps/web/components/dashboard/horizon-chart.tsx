"use client";

import { useEffect, useState } from "react";

import type { ObservationWire } from "@repo/shared";

import { HORIZONS, useHorizon } from "@/components/dashboard/horizon-context";
import { LineChart } from "@/components/dashboard/line-chart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * A line chart whose window follows the shared time-horizon. Seeded with the
 * server-rendered `initial` spark for instant paint, then re-fetches the series
 * (dated + downsampled) whenever the horizon changes so the axes stay accurate.
 */
export function HorizonChart({
  seriesId,
  initial,
}: {
  seriesId: string;
  initial: number[];
}) {
  const { horizon } = useHorizon();
  const [values, setValues] = useState<number[]>(initial);
  const [dates, setDates] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const days = HORIZONS.find((h) => h.id === horizon)?.days ?? null;
    const from = days
      ? new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
      : null;
    const url = `${API_URL}/api/finance/series/${encodeURIComponent(seriesId)}/observations?sample=120${from ? `&from=${from}` : ""}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { observations?: ObservationWire[] } | null) => {
        if (!alive || !d?.observations) return;
        const pts = d.observations.filter(
          (o): o is { date: string; value: number } => o.value != null,
        );
        if (pts.length > 1) {
          setValues(pts.map((p) => p.value));
          setDates(pts.map((p) => p.date));
        }
      })
      .catch(() => {
        /* keep last-known chart */
      });
    return () => {
      alive = false;
    };
  }, [seriesId, horizon]);

  return <LineChart values={values} dates={dates} />;
}
