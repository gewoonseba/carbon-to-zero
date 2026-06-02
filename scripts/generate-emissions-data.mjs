/**
 * Generates the CO₂ emissions CSV datasets used by the Carbon to Zero
 * data-visualisation page.
 *
 * Figures are anchored on real-world data from Our World in Data / the Global
 * Carbon Project (fossil CO₂, ~2022). Annual values for the time series are
 * interpolated between historical anchor points to produce smooth, plausible
 * curves. The data is illustrative and intended for a marketing demo.
 *
 * Run with:  node scripts/generate-emissions-data.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "data");
mkdirSync(OUT_DIR, { recursive: true });

const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/* ------------------------------------------------------------------ */
/* 1. Time series — fossil CO₂ by region, 1950–2022 (million tonnes)  */
/* ------------------------------------------------------------------ */

// Anchor points [year, value in Mt] per region. Linear interpolation between.
const REGION_ANCHORS = {
  China: [
    [1950, 80], [1960, 780], [1970, 800], [1980, 1450], [1990, 2420],
    [2000, 3550], [2005, 5900], [2010, 8530], [2013, 9760], [2015, 9970],
    [2019, 10700], [2020, 10900], [2022, 11397],
  ],
  "United States": [
    [1950, 2300], [1960, 2900], [1970, 4300], [1980, 4750], [1990, 5100],
    [2000, 5870], [2007, 6130], [2010, 5700], [2015, 5350], [2019, 5260],
    [2020, 4710], [2021, 5030], [2022, 5057],
  ],
  "European Union": [
    [1950, 1620], [1960, 2350], [1970, 3100], [1979, 3520], [1990, 3650],
    [2000, 3470], [2008, 3550], [2010, 3160], [2015, 2960], [2019, 2730],
    [2020, 2530], [2022, 2580],
  ],
  India: [
    [1950, 50], [1970, 200], [1980, 300], [1990, 600], [2000, 980],
    [2010, 1660], [2015, 2080], [2019, 2470], [2020, 2380], [2022, 2830],
  ],
  Russia: [
    [1950, 820], [1970, 1900], [1985, 2450], [1990, 2550], [1992, 2200],
    [1998, 1530], [2000, 1560], [2010, 1650], [2019, 1680], [2022, 1652],
  ],
  Japan: [
    [1950, 110], [1970, 760], [1980, 920], [1990, 1080], [2000, 1180],
    [2013, 1250], [2019, 1110], [2020, 1030], [2022, 1083],
  ],
};

// Global fossil CO₂ total anchors (Mt) — used to derive "Rest of World".
const GLOBAL_ANCHORS = [
  [1950, 6000], [1960, 9400], [1970, 14900], [1980, 19500], [1990, 22700],
  [2000, 25450], [2010, 33300], [2015, 35500], [2019, 37100], [2020, 35300],
  [2021, 37120], [2022, 37150],
];

function interp(anchors, year) {
  if (year <= anchors[0][0]) return anchors[0][1];
  if (year >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [y0, v0] = anchors[i];
    const [y1, v1] = anchors[i + 1];
    if (year >= y0 && year <= y1) {
      const t = (year - y0) / (y1 - y0);
      return v0 + (v1 - v0) * t;
    }
  }
  return anchors[anchors.length - 1][1];
}

const regions = Object.keys(REGION_ANCHORS);
const trendRows = [];
for (let year = 1950; year <= 2022; year++) {
  const row = { year };
  let namedTotal = 0;
  for (const r of regions) {
    const v = round(interp(REGION_ANCHORS[r], year));
    row[r] = v;
    namedTotal += v;
  }
  const global = interp(GLOBAL_ANCHORS, year);
  row["Rest of World"] = round(Math.max(0, global - namedTotal));
  trendRows.push(row);
}

const trendCols = ["year", ...regions, "Rest of World"];
const trendCsv = [
  trendCols.join(","),
  ...trendRows.map((r) => trendCols.map((c) => r[c]).join(",")),
].join("\n");
writeFileSync(join(OUT_DIR, "emissions-by-region.csv"), trendCsv + "\n");

/* ------------------------------------------------------------------ */
/* 2. By country — 2022 snapshot                                      */
/* ------------------------------------------------------------------ */
// [country, iso3, region, co2_mt, population_millions]
const COUNTRIES = [
  ["China", "CHN", "Asia Pacific", 11397, 1412],
  ["United States", "USA", "North America", 5057, 333],
  ["India", "IND", "Asia Pacific", 2830, 1417],
  ["Russia", "RUS", "Eurasia", 1652, 144],
  ["Japan", "JPN", "Asia Pacific", 1083, 125],
  ["Iran", "IRN", "Middle East", 749, 88],
  ["Indonesia", "IDN", "Asia Pacific", 692, 275],
  ["Germany", "DEU", "Europe", 666, 84],
  ["South Korea", "KOR", "Asia Pacific", 616, 51.7],
  ["Saudi Arabia", "SAU", "Middle East", 607, 36],
  ["Canada", "CAN", "North America", 575, 38.5],
  ["Brazil", "BRA", "South America", 489, 215],
  ["Mexico", "MEX", "North America", 487, 128],
  ["Turkey", "TUR", "Europe", 452, 85],
  ["South Africa", "ZAF", "Africa", 435, 60],
  ["Australia", "AUS", "Asia Pacific", 391, 26],
  ["Vietnam", "VNM", "Asia Pacific", 327, 98],
  ["United Kingdom", "GBR", "Europe", 322, 67],
  ["Italy", "ITA", "Europe", 317, 59],
  ["France", "FRA", "Europe", 302, 68],
  ["Poland", "POL", "Europe", 285, 37],
  ["Thailand", "THA", "Asia Pacific", 283, 71],
  ["Kazakhstan", "KAZ", "Eurasia", 277, 19.6],
  ["Malaysia", "MYS", "Asia Pacific", 251, 33],
  ["Egypt", "EGY", "Africa", 249, 110],
  ["Spain", "ESP", "Europe", 241, 47],
  ["United Arab Emirates", "ARE", "Middle East", 235, 9.4],
  ["Pakistan", "PAK", "Asia Pacific", 218, 235],
  ["Argentina", "ARG", "South America", 195, 46],
  ["Iraq", "IRQ", "Middle East", 194, 43],
  ["Algeria", "DZA", "Africa", 177, 45],
  ["Philippines", "PHL", "Asia Pacific", 150, 115],
  ["Netherlands", "NLD", "Europe", 137, 17.6],
  ["Ukraine", "UKR", "Europe", 130, 38],
  ["Nigeria", "NGA", "Africa", 126, 218],
  ["Bangladesh", "BGD", "Asia Pacific", 110, 171],
  ["Qatar", "QAT", "Middle East", 100, 2.7],
  ["Colombia", "COL", "South America", 96, 52],
  ["Czechia", "CZE", "Europe", 96, 10.5],
  ["Belgium", "BEL", "Europe", 96, 11.6],
  ["Chile", "CHL", "South America", 85, 19.6],
  ["Singapore", "SGP", "Asia Pacific", 56, 5.9],
  ["Norway", "NOR", "Europe", 39, 5.4],
  ["Sweden", "SWE", "Europe", 38, 10.5],
];

const GLOBAL_2022 = 37150;
const WORLD_POP = 7950; // millions, 2022
const namedCountryTotal = COUNTRIES.reduce((s, c) => s + c[3], 0);
const namedPopTotal = COUNTRIES.reduce((s, c) => s + c[4], 0);
COUNTRIES.push([
  "Rest of World", "ROW", "Other",
  round(GLOBAL_2022 - namedCountryTotal),
  round(WORLD_POP - namedPopTotal),
]);

const countryCols = [
  "country", "iso3", "region", "co2_mt", "population_millions",
  "co2_per_capita_t", "share_global_pct",
];
const countryRows = COUNTRIES.map(([country, iso3, region, co2, pop]) => {
  const perCapita = round(co2 / pop, 2);
  const share = round((co2 / GLOBAL_2022) * 100, 2);
  return [country, iso3, region, co2, pop, perCapita, share].join(",");
});
writeFileSync(
  join(OUT_DIR, "emissions-by-country.csv"),
  [countryCols.join(","), ...countryRows].join("\n") + "\n",
);

/* ------------------------------------------------------------------ */
/* 3. By sector — global energy & industry CO₂ share                  */
/* ------------------------------------------------------------------ */
// [sector, group, raw_share]
const SECTORS = [
  ["Electricity & Heat", "Energy", 30.4],
  ["Agriculture & Land Use", "Land", 18.4],
  ["Road Transport", "Transport", 11.9],
  ["Manufacturing & Construction", "Industry", 12.4],
  ["Buildings", "Buildings", 8.7],
  ["Industrial Processes", "Industry", 5.6],
  ["Fugitive Emissions", "Energy", 5.8],
  ["Aviation & Shipping", "Transport", 3.6],
  ["Waste", "Waste", 3.2],
];
const sectorTotal = SECTORS.reduce((s, x) => s + x[2], 0);
const sectorCols = ["sector", "group", "share_pct", "co2_mt"];
const sectorRows = SECTORS.map(([sector, group, raw]) => {
  const share = round((raw / sectorTotal) * 100, 1);
  const co2 = round((share / 100) * GLOBAL_2022);
  return [sector, group, share, co2].join(",");
});
writeFileSync(
  join(OUT_DIR, "emissions-by-sector.csv"),
  [sectorCols.join(","), ...sectorRows].join("\n") + "\n",
);

console.log("Wrote 3 CSV files to", OUT_DIR);
console.log(`  emissions-by-region.csv   (${trendRows.length} years × ${regions.length + 1} regions)`);
console.log(`  emissions-by-country.csv  (${COUNTRIES.length} countries)`);
console.log(`  emissions-by-sector.csv   (${SECTORS.length} sectors)`);
