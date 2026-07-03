"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type HorizonId = "6M" | "1Y" | "5Y" | "Max";

export const HORIZONS: { id: HorizonId; label: string; days: number | null }[] = [
  { id: "6M", label: "6M", days: 182 },
  { id: "1Y", label: "1Y", days: 365 },
  { id: "5Y", label: "5Y", days: 365 * 5 },
  { id: "Max", label: "Max", days: null },
];

const HorizonCtx = createContext<{
  horizon: HorizonId;
  setHorizon: (h: HorizonId) => void;
}>({ horizon: "1Y", setHorizon: () => {} });

export const useHorizon = () => useContext(HorizonCtx);

/** Shares the selected chart time-horizon across the dashboard's sparklines. */
export function HorizonProvider({ children }: { children: ReactNode }) {
  const [horizon, setHorizon] = useState<HorizonId>("1Y");
  return (
    <HorizonCtx.Provider value={{ horizon, setHorizon }}>
      {children}
    </HorizonCtx.Provider>
  );
}
