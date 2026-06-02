import { format } from "d3";

const f1 = format(".1f");
const f2 = format(".2f");
const fInt = format(",d");

/** Kilograms of CO₂ → a compact "t / kg" string. */
export function formatKg(kg: number): string {
  if (Math.abs(kg) >= 1000) return `${f2(kg / 1000)} t`;
  return `${fInt(Math.round(kg))} kg`;
}

/** Kilograms → tonnes with one decimal (axis-friendly). */
export function formatKgAsTonnes(kg: number): string {
  return `${f1(kg / 1000)} t`;
}

/** A tonnes value with one decimal. */
export function formatTonnes(t: number): string {
  return `${f1(t)} t`;
}

/** A tonnes value with two decimals (small per-site figures). */
export function formatTonnes2(t: number): string {
  return `${f2(t)} t`;
}

export function formatPercent(pct: number): string {
  return `${f1(pct)}%`;
}

export function formatPercentInt(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function formatInt(n: number): string {
  return fInt(Math.round(n));
}
