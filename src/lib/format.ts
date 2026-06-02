import { format } from "d3";

const f1 = format(".1f");
const f2 = format(".2f");
const fInt = format(",d");

/** Million tonnes → a compact "Gt / Mt" string. */
export function formatMt(mt: number): string {
  if (mt >= 1000) return `${f1(mt / 1000)} Gt`;
  return `${fInt(Math.round(mt))} Mt`;
}

/** Raw million-tonnes value with thousands separators. */
export function formatMtRaw(mt: number): string {
  return `${fInt(Math.round(mt))} Mt`;
}

/** Gigatonnes with one decimal. */
export function formatGt(mt: number): string {
  return `${f1(mt / 1000)} Gt`;
}

export function formatPerCapita(t: number): string {
  return `${f1(t)} t`;
}

export function formatPercent(pct: number): string {
  return `${f1(pct)}%`;
}

export function formatPercentInt(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function formatPopulation(millions: number): string {
  if (millions >= 1000) return `${f2(millions / 1000)} bn`;
  return `${f1(millions)} m`;
}
