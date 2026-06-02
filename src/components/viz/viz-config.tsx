"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_PALETTE_ID,
  getPalette,
  type Palette,
} from "@/lib/palettes";

export type RankMetric = "total" | "perCapita";

export interface VizConfig {
  paletteId: string;
  showGrid: boolean;
  showValues: boolean;
  showAnnotations: boolean;
  animate: boolean;
  rankMetric: RankMetric;
  topN: number;
}

const DEFAULT_CONFIG: VizConfig = {
  paletteId: DEFAULT_PALETTE_ID,
  showGrid: true,
  showValues: true,
  showAnnotations: true,
  animate: true,
  rankMetric: "perCapita",
  topN: 12,
};

interface VizConfigContextValue {
  config: VizConfig;
  palette: Palette;
  update: (patch: Partial<VizConfig>) => void;
  reset: () => void;
}

const VizConfigContext = createContext<VizConfigContextValue | null>(null);

/** Adds alpha to a 6-digit hex colour (fraction 0–1). */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function VizConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<VizConfig>(DEFAULT_CONFIG);
  const palette = useMemo(() => getPalette(config.paletteId), [config.paletteId]);

  const update = useCallback((patch: Partial<VizConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setConfig(DEFAULT_CONFIG), []);

  // Drive the global UI accent (buttons, sliders, focus rings, glows) from the
  // currently-selected visualisation palette.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--c2z-accent", palette.accent);
    root.style.setProperty("--c2z-accent-soft", withAlpha(palette.accent, 0.16));
  }, [palette]);

  const value = useMemo(
    () => ({ config, palette, update, reset }),
    [config, palette, update, reset],
  );

  return (
    <VizConfigContext.Provider value={value}>
      {children}
    </VizConfigContext.Provider>
  );
}

export function useVizConfig(): VizConfigContextValue {
  const ctx = useContext(VizConfigContext);
  if (!ctx) {
    throw new Error("useVizConfig must be used within a VizConfigProvider");
  }
  return ctx;
}
