/**
 * Client-side scoping of the Carbon Reporting fixtures. Given the full
 * `SavingsData` and a filter (a date window + a set of customers), this
 * recomputes the per-customer headline, the stacked cumulative trend, the
 * fleet silhouette and the fleet headline so every chart re-narrates for the
 * chosen scope — the same shape `GET .../timeline?from&to` would return.
 */
import type {
  CustomerSaving,
  FleetTotal,
  FleetTrendPoint,
  SavingsData,
  SavingsTrend,
  SavingsTrendRow,
} from "./types";

export interface FilterState {
  /** Inclusive ISO yyyy-mm-dd window start. */
  from: string;
  /** Inclusive ISO yyyy-mm-dd window end. */
  to: string;
  /** Selected customer ids. */
  customerIds: string[];
}

export interface DateBounds {
  min: string;
  max: string;
}

/** Shift an ISO yyyy-mm-dd date by whole days (UTC, timezone-independent). */
export function shiftISODays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Every day in [from, to] inclusive, as ISO yyyy-mm-dd. */
function eachDayISO(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`).getTime();
  while (cur.getTime() <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** A quick date-range shortcut, resolved against the data's bounds. */
export interface RangePreset {
  id: string;
  label: string;
  resolve: (bounds: DateBounds) => { from: string; to: string };
}

/** Clamp a candidate start so it never precedes the data's earliest day. */
const clampStart = (candidate: string, min: string) =>
  candidate < min ? min : candidate;

export const RANGE_PRESETS: RangePreset[] = [
  { id: "all", label: "All time", resolve: (b) => ({ from: b.min, to: b.max }) },
  {
    id: "30d",
    label: "Last 30 days",
    resolve: (b) => ({ from: clampStart(shiftISODays(b.max, -29), b.min), to: b.max }),
  },
  {
    id: "90d",
    label: "Last 90 days",
    resolve: (b) => ({ from: clampStart(shiftISODays(b.max, -89), b.min), to: b.max }),
  },
];

/** Which preset (if any) the current window matches. */
export function matchPreset(
  state: Pick<FilterState, "from" | "to">,
  bounds: DateBounds,
): string | null {
  for (const p of RANGE_PRESETS) {
    const r = p.resolve(bounds);
    if (r.from === state.from && r.to === state.to) return p.id;
  }
  return null;
}

/** True when the filter selects the whole dataset (full window, every site). */
export function isDefaultFilter(state: FilterState, data: SavingsData): boolean {
  return (
    state.from === data.range.min &&
    state.to === data.range.max &&
    state.customerIds.length === data.customers.length
  );
}

/**
 * Scope the dataset to a date window and a set of customers. Per-customer
 * headline figures are re-summed from the raw daily series; the stacked trend
 * is re-baselined to zero at the window start so the curve shows the carbon
 * saved *during* the selected window.
 */
export function filterSavings(data: SavingsData, state: FilterState): SavingsData {
  const { from, to } = state;
  const selected = new Set(state.customerIds);
  const seriesById = new Map(data.series.map((s) => [s.id, s]));

  // ---- per-customer window headline --------------------------------------
  const customers: CustomerSaving[] = data.customers
    .filter((c) => selected.has(c.id))
    .map((c) => {
      let withKg = 0;
      let withoutKg = 0;
      let savedKg = 0;
      for (const p of seriesById.get(c.id)?.points ?? []) {
        if (p.date < from || p.date > to) continue;
        withKg += p.withKg;
        withoutKg += p.withoutKg;
        savedKg += p.savedKg;
      }
      return {
        ...c,
        withKg,
        withoutKg,
        savedKg,
        savedTonnes: savedKg / 1000,
        pctReduction: withoutKg > 0 ? (savedKg / withoutKg) * 100 : 0,
      };
    })
    .sort((a, b) => b.savedKg - a.savedKg);

  const orderedNames = customers.map((c) => c.name);

  // per-customer date → saved kg lookup (selected customers only)
  const savedByCustomer = new Map<string, Map<string, number>>();
  for (const c of customers) {
    const m = new Map<string, number>();
    for (const p of seriesById.get(c.id)?.points ?? []) m.set(p.date, p.savedKg);
    savedByCustomer.set(c.name, m);
  }

  // ---- re-baselined cumulative stacked rows ------------------------------
  const running = new Map<string, number>(orderedNames.map((n) => [n, 0]));
  const rows: SavingsTrendRow[] = eachDayISO(from, to).map((iso) => {
    const row = {
      date: iso,
      t: new Date(`${iso}T00:00:00Z`).getTime(),
    } as SavingsTrendRow;
    for (const name of orderedNames) {
      const add = savedByCustomer.get(name)?.get(iso) ?? 0;
      running.set(name, (running.get(name) ?? 0) + add);
      row[name] = running.get(name) ?? 0;
    }
    return row;
  });

  const trend: SavingsTrend = { customers: orderedNames, rows };

  const fleetTrend: FleetTrendPoint[] = rows.map((r) => ({
    date: r.date as string,
    cum: orderedNames.reduce((s, n) => s + ((r[n] as number) ?? 0), 0),
  }));

  // ---- fleet headline ----------------------------------------------------
  const totalSavedKg = customers.reduce((s, c) => s + c.savedKg, 0);
  const totalWithoutKg = customers.reduce((s, c) => s + c.withoutKg, 0);
  const batteryCount = customers.reduce((s, c) => s + c.nBatteries, 0);
  const bestReductionPct = customers.length
    ? Math.max(...customers.map((c) => c.pctReduction))
    : 0;

  const fleet: FleetTotal = {
    since: from,
    to,
    totalSavedTonnes: totalSavedKg / 1000,
    totalSavedKg,
    totalWithoutKg,
    customerCount: customers.length,
    batteryCount,
    bestReductionPct,
    fleetReductionPct: totalWithoutKg > 0 ? (totalSavedKg / totalWithoutKg) * 100 : 0,
  };

  return { fleet, customers, trend, fleetTrend, series: data.series, range: data.range };
}
