import { readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { timeDay } from "d3";
import type {
  CustomerSaving,
  CustomerSeries,
  FleetTotal,
  FleetTrendPoint,
  SavingsData,
  SavingsTrend,
  SavingsTrendRow,
} from "./types";

/**
 * Server-side loading of the Carbon Reporting fixtures. The savings datasets
 * live in `public/data/savings` (so they double as static assets) and are read
 * from disk at render time — these mirror the shapes the future
 * `GET /co2/total` and `GET /co2/customers/{id}/timeline` endpoints return.
 */
function readJson<T>(...segments: string[]): T {
  const file = path.join(process.cwd(), "public", "data", "savings", ...segments);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

const PROFILE_LABELS: Record<string, string> = {
  single_ci_battery: "Grid-scale battery",
  residential_vpp: "Residential VPP",
  commercial_solar: "Commercial + solar",
};

function profileLabel(profile: string): string {
  return PROFILE_LABELS[profile] ?? profile.replace(/_/g, " ");
}

interface IndexFile {
  customers: Array<{
    customer_id: string;
    name: string;
    location: string;
    country: string;
    steering_start_date: string;
    profile: string;
    n_batteries: number;
    co2_saved_tonnes: number;
  }>;
}

interface TimelineFile {
  customer_id: string;
  name: string;
  steering_start_date: string;
  series: Array<{
    date: string;
    co2_with_kg: number;
    co2_without_kg: number;
    co2_saved_kg: number;
    cum_saved_kg: number;
  }>;
  totals: {
    co2_with_kg: number;
    co2_without_kg: number;
    co2_saved_kg: number;
    co2_saved_tonnes: number;
    pct_reduction: number;
    from: string;
    to: string;
    n_batteries: number;
  };
}

const parseDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export const getSavingsData = cache((): SavingsData => {
  const index = readJson<IndexFile>("customers.json");
  const timelines = index.customers.map((c) =>
    readJson<TimelineFile>("timelines", `${c.customer_id}.json`),
  );

  // ---- per-customer raw daily series (drives client-side filtering) ------
  const series: CustomerSeries[] = index.customers.map((c, i) => ({
    id: c.customer_id,
    name: c.name,
    steeringStart: c.steering_start_date,
    points: timelines[i].series.map((row) => ({
      date: row.date,
      withKg: row.co2_with_kg,
      withoutKg: row.co2_without_kg,
      savedKg: row.co2_saved_kg,
    })),
  }));

  // ---- per-customer headline (totals + index metadata) -------------------
  const customers: CustomerSaving[] = index.customers.map((c, i) => {
    const t = timelines[i].totals;
    return {
      id: c.customer_id,
      name: c.name,
      location: c.location,
      country: c.country,
      profile: c.profile,
      profileLabel: profileLabel(c.profile),
      steeringStart: c.steering_start_date,
      nBatteries: c.n_batteries,
      withKg: t.co2_with_kg,
      withoutKg: t.co2_without_kg,
      savedKg: t.co2_saved_kg,
      savedTonnes: t.co2_saved_tonnes,
      pctReduction: t.pct_reduction,
    };
  });

  // Order largest-saving first so charts read big-to-small and the stacked
  // area puts the dominant band on the bottom.
  customers.sort((a, b) => b.savedKg - a.savedKg);
  const orderedNames = customers.map((c) => c.name);

  // ---- unified daily axis + cumulative stacked rows ----------------------
  // Build a per-customer date→cum_saved_kg lookup, then forward-fill across the
  // full fleet window (0 before a customer's steering starts).
  const cumByCustomer = new Map<string, Map<string, number>>();
  let minDate = parseDate(timelines[0].series[0].date);
  let maxDate = minDate;
  for (const tl of timelines) {
    const m = new Map<string, number>();
    for (const row of tl.series) {
      m.set(row.date, row.cum_saved_kg);
      const d = parseDate(row.date);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    }
    cumByCustomer.set(tl.name, m);
  }

  const days = timeDay.range(minDate, timeDay.offset(maxDate, 1));
  const lastSeen = new Map<string, number>(orderedNames.map((n) => [n, 0]));

  const rows: SavingsTrendRow[] = days.map((day) => {
    const iso = fmtDate(day);
    const row = { date: iso, t: day.getTime() } as SavingsTrendRow;
    for (const name of orderedNames) {
      const cum = cumByCustomer.get(name)?.get(iso);
      if (cum != null) lastSeen.set(name, cum);
      row[name] = lastSeen.get(name) ?? 0;
    }
    return row;
  });

  const trend: SavingsTrend = { customers: orderedNames, rows };

  const fleetTrend: FleetTrendPoint[] = rows.map((r) => ({
    date: r.date as string,
    cum: orderedNames.reduce((s, n) => s + ((r[n] as number) ?? 0), 0),
  }));

  // ---- fleet headline ----------------------------------------------------
  const total = readJson<{
    since: string;
    total_co2_saved_tonnes: number;
    customer_count: number;
  }>("total.json");

  const totalSavedKg = customers.reduce((s, c) => s + c.savedKg, 0);
  const totalWithoutKg = customers.reduce((s, c) => s + c.withoutKg, 0);
  const batteryCount = customers.reduce((s, c) => s + c.nBatteries, 0);
  const bestReductionPct = Math.max(...customers.map((c) => c.pctReduction));

  const fleet: FleetTotal = {
    since: total.since,
    to: fmtDate(maxDate),
    totalSavedTonnes: total.total_co2_saved_tonnes,
    totalSavedKg,
    totalWithoutKg,
    customerCount: total.customer_count,
    batteryCount,
    bestReductionPct,
    fleetReductionPct: (totalSavedKg / totalWithoutKg) * 100,
  };

  const range = { min: fmtDate(minDate), max: fmtDate(maxDate) };

  return { fleet, customers, trend, fleetTrend, series, range };
});
