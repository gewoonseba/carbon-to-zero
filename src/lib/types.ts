/** A single year of fossil-CO₂ emissions, broken down by region (million tonnes). */
export type RegionTrendRow = { year: number } & Record<string, number>;

export interface RegionTrend {
  /** Region column names, ordered largest-cumulative first. */
  regions: string[];
  rows: RegionTrendRow[];
}

/** One country's 2022 fossil-CO₂ snapshot. */
export interface CountryEmission {
  country: string;
  iso3: string;
  region: string;
  co2_mt: number;
  population_millions: number;
  co2_per_capita_t: number;
  share_global_pct: number;
}

/** Global emissions attributable to a single sector. */
export interface SectorEmission {
  sector: string;
  group: string;
  share_pct: number;
  co2_mt: number;
}

export interface EmissionsData {
  regionTrend: RegionTrend;
  countries: CountryEmission[];
  sectors: SectorEmission[];
}
