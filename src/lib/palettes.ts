import { interpolateRgbBasis } from "d3";

export interface Palette {
  id: string;
  label: string;
  description: string;
  /** Primary highlight — also drives the UI accent (--c2z-accent). */
  accent: string;
  /** Ordered categorical colours for regions / sectors (≥8). */
  categorical: string[];
  /** Dark→bright colour stops for sequential ramps (intensity, gradients). */
  ramp: string[];
}

export const PALETTES: Palette[] = [
  {
    id: "indigo",
    label: "Indigo",
    description: "The Companion brand — purple, lavender and rose.",
    accent: "#5d5fef",
    categorical: [
      "#5d5fef", "#8587ff", "#a78bfa", "#c4b5fd",
      "#f77c0e", "#2dd4bf", "#fb7185", "#38bdf8",
    ],
    ramp: ["#181146", "#5d5fef", "#9d94ed", "#ddc9ea"],
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Mint, teal and cyan over near-black.",
    accent: "#5eead4",
    categorical: [
      "#34d399", "#22d3ee", "#38bdf8", "#818cf8",
      "#c084fc", "#fbbf24", "#fb7185", "#a3e635",
    ],
    ramp: ["#082f2b", "#0e7490", "#22d3ee", "#a7f3d0"],
  },
  {
    id: "solar",
    label: "Solar",
    description: "Gold and amber with cool cyan counterpoints.",
    accent: "#fbbf24",
    categorical: [
      "#fbbf24", "#f59e0b", "#fb923c", "#22d3ee",
      "#2dd4bf", "#60a5fa", "#f472b6", "#a3e635",
    ],
    ramp: ["#341f06", "#92400e", "#f59e0b", "#fde68a"],
  },
  {
    id: "ember",
    label: "Ember",
    description: "A heat map — crimson through to molten yellow.",
    accent: "#fb923c",
    categorical: [
      "#fb923c", "#f97316", "#ef4444", "#fb7185",
      "#f59e0b", "#facc15", "#fda4af", "#fdba74",
    ],
    ramp: ["#3b0a0a", "#991b1b", "#f97316", "#fde68a"],
  },
  {
    id: "ice",
    label: "Ice",
    description: "Cool blues and violets, glacier-clean.",
    accent: "#7dd3fc",
    categorical: [
      "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa",
      "#22d3ee", "#2dd4bf", "#7dd3fc", "#c4b5fd",
    ],
    ramp: ["#0b1738", "#1e40af", "#3b82f6", "#bae6fd"],
  },
];

export const DEFAULT_PALETTE_ID = "indigo";

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** A sequential interpolator t∈[0,1] → colour for the given palette. */
export function rampOf(palette: Palette): (t: number) => string {
  return interpolateRgbBasis(palette.ramp);
}

/**
 * Builds a stable category→colour lookup. Categories are assigned colours by
 * their position in `domain`, wrapping the categorical array if needed.
 */
export function categoryColors(
  palette: Palette,
  domain: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  domain.forEach((key, i) => {
    map.set(key, palette.categorical[i % palette.categorical.length]);
  });
  return map;
}
