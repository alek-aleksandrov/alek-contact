import { Injectable } from "@nestjs/common";

const FRED_BASE = "https://api.stlouisfed.org/fred";

export type FredSeriesMeta = {
  id: string;
  title: string;
  units: string;
  frequency: string;
  seasonalAdjustment: string | null;
  notes: string | null;
  lastUpdatedRemote: Date | null;
};

export type FredObservationRaw = { date: Date; value: number | null };

/** Thin FRED HTTP client. Adds `api_key` + `file_type=json`; parses `.` → null. */
@Injectable()
export class FredClient {
  private key(): string {
    const key = process.env.FRED_API_KEY;
    if (!key) throw new Error("FRED_API_KEY is not set");
    return key;
  }

  async getSeries(id: string): Promise<FredSeriesMeta> {
    const url = `${FRED_BASE}/series?series_id=${id}&api_key=${this.key()}&file_type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED series ${id} failed: ${res.status}`);
    const json = (await res.json()) as {
      seriess?: Array<{
        title: string;
        units: string;
        frequency: string;
        seasonal_adjustment?: string;
        notes?: string;
        last_updated?: string;
      }>;
    };
    const s = json.seriess?.[0];
    if (!s) throw new Error(`FRED series ${id}: no metadata`);
    return {
      id,
      title: s.title,
      units: s.units,
      frequency: s.frequency,
      seasonalAdjustment: s.seasonal_adjustment ?? null,
      notes: s.notes ?? null,
      lastUpdatedRemote: s.last_updated ? new Date(s.last_updated) : null,
    };
  }

  async getObservations(id: string): Promise<FredObservationRaw[]> {
    const url = `${FRED_BASE}/series/observations?series_id=${id}&api_key=${this.key()}&file_type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED observations ${id} failed: ${res.status}`);
    const json = (await res.json()) as {
      observations?: Array<{ date: string; value: string }>;
    };
    return (json.observations ?? []).map((o) => ({
      date: new Date(o.date),
      value: o.value === "." ? null : Number(o.value),
    }));
  }
}
