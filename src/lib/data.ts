import { readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { csvParse } from "d3";
import type {
  CountryEmission,
  EmissionsData,
  RegionTrend,
  RegionTrendRow,
  SectorEmission,
} from "./types";

/**
 * Server-side CSV loading. The datasets live in `public/data` (so they are
 * also reachable as static assets) and are read from disk at render time —
 * no backend, no client-side fetch waterfall, fully crawlable HTML.
 */
function readCsv(file: string): string {
  return readFileSync(path.join(process.cwd(), "public", "data", file), "utf8");
}

function loadRegionTrend(): RegionTrend {
  const text = readCsv("emissions-by-region.csv");
  const parsed = csvParse(text);
  const regions = (parsed.columns ?? []).filter((c) => c !== "year");

  const rows: RegionTrendRow[] = parsed.map((d) => {
    const row = { year: +d.year! } as RegionTrendRow;
    for (const r of regions) row[r] = +d[r]!;
    return row;
  });

  // Order regions by their latest-year value so stacks read big-to-small.
  const last = rows[rows.length - 1];
  const ordered = [...regions].sort((a, b) => (last[b] ?? 0) - (last[a] ?? 0));

  return { regions: ordered, rows };
}

function loadCountries(): CountryEmission[] {
  const text = readCsv("emissions-by-country.csv");
  return csvParse(text, (d) => ({
    country: d.country!,
    iso3: d.iso3!,
    region: d.region!,
    co2_mt: +d.co2_mt!,
    population_millions: +d.population_millions!,
    co2_per_capita_t: +d.co2_per_capita_t!,
    share_global_pct: +d.share_global_pct!,
  })) as CountryEmission[];
}

function loadSectors(): SectorEmission[] {
  const text = readCsv("emissions-by-sector.csv");
  return csvParse(text, (d) => ({
    sector: d.sector!,
    group: d.group!,
    share_pct: +d.share_pct!,
    co2_mt: +d.co2_mt!,
  })) as SectorEmission[];
}

/** Loads every dataset once per render pass. */
export const getEmissionsData = cache((): EmissionsData => {
  return {
    regionTrend: loadRegionTrend(),
    countries: loadCountries(),
    sectors: loadSectors(),
  };
});
