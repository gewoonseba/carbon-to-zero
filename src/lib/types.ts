/**
 * Domain types for the Carbon Reporting "savings" story. Mirrors the
 * Companion Carbon Reporting API contract: a fleet headline plus one daily
 * timeline per customer (avoided CO₂ from steering their batteries).
 */

/** A customer's headline savings, from each timeline's `totals` + index. */
export interface CustomerSaving {
  id: string;
  name: string;
  location: string;
  /** Two-letter country code, e.g. "NL" / "BE". */
  country: string;
  /** Steering profile, e.g. "residential_vpp" / "single_ci_battery". */
  profile: string;
  /** Human label for the profile, e.g. "Grid-scale battery". */
  profileLabel: string;
  steeringStart: string;
  nBatteries: number;
  /** Actual emissions with steering, kg CO₂. */
  withKg: number;
  /** Counterfactual emissions without the battery, kg CO₂. */
  withoutKg: number;
  /** Avoided emissions = without − with, kg CO₂. */
  savedKg: number;
  savedTonnes: number;
  /** Percentage by which steering cut this site's emissions. */
  pctReduction: number;
}

/** One day on the unified fleet axis: cumulative saved kg per customer. */
export type SavingsTrendRow = { date: string; t: number } & Record<
  string,
  number | string
>;

export interface SavingsTrend {
  /** Customer names, ordered largest-cumulative first (bottom of the stack). */
  customers: string[];
  rows: SavingsTrendRow[];
}

/** Fleet-wide headline (GET /co2/total, enriched). */
export interface FleetTotal {
  since: string;
  to: string;
  totalSavedTonnes: number;
  totalSavedKg: number;
  totalWithoutKg: number;
  customerCount: number;
  batteryCount: number;
  /** Best single-site reduction, %. */
  bestReductionPct: number;
  /** Fleet-wide reduction = saved / without, %. */
  fleetReductionPct: number;
}

/** A single point on the fleet's cumulative-savings silhouette. */
export interface FleetTrendPoint {
  date: string;
  cum: number;
}

/** One day of a customer's raw (non-cumulative) savings. */
export interface CustomerDailyPoint {
  date: string;
  /** Actual emissions with steering, kg CO₂. */
  withKg: number;
  /** Counterfactual emissions without the battery, kg CO₂. */
  withoutKg: number;
  /** Avoided emissions that day, kg CO₂. */
  savedKg: number;
}

/**
 * A customer's full daily timeline, kept raw so the client can recompute
 * window totals for any date range (mirrors `GET .../timeline?from&to`).
 */
export interface CustomerSeries {
  id: string;
  name: string;
  steeringStart: string;
  points: CustomerDailyPoint[];
}

export interface SavingsData {
  fleet: FleetTotal;
  customers: CustomerSaving[];
  trend: SavingsTrend;
  /** Fleet cumulative total per day — drives the hero backdrop. */
  fleetTrend: FleetTrendPoint[];
  /** Per-customer raw daily series — drives client-side date filtering. */
  series: CustomerSeries[];
  /** Inclusive selectable date bounds across the whole fleet (ISO yyyy-mm-dd). */
  range: { min: string; max: string };
}
