# Mock CO₂-savings data

Mock data for **four different customers**, conforming to the
[Carbon Reporting](https://didactic-chainsaw-p34w5g9.pages.github.io/shares/2026-06-02-co2-savings-plan/)
schema/API contract and calibrated to the real Hegg fleet Excel
(`Hegg_C022_savings_all_sites.xlsx`).

Regenerate any time (deterministic, stdlib-only — no pandas/openpyxl needed):

```bash
python3 mock-data/generate.py
```

## The four customers

| Customer | Country | Profile | Batteries | Window | CO₂ saved |
|---|---|---|---|---|---|
| **Helios Buurtbatterij** | NL | residential VPP (home batteries) | 72 | from 2026‑01‑15 | ~3.19 t |
| **Polderwatt Energieopslag** | NL | single large steered C&I battery (2 MWh) | 1 | from 2026‑01‑01 | ~8.75 t |
| **Brouwerij De Vlaamse Leeuw** | BE | commercial site + rooftop solar | 1 | from 2026‑02‑01 | ~0.91 t |
| **Groene Weide Coöperatie** | BE | small residential community | 14 | from 2026‑03‑01 | ~0.19 t |

All four customers are fictional. Fleet headline: **~13.0 tonnes CO₂ saved since
2026‑01‑01** across 4 customers.
The mix is deliberate: two countries (drives `market_data` per country), one
grid‑scale battery vs. residential fleets, and a solar‑heavy commercial site
that sometimes nets *injection* (negative `co2_with`) at midday.

## What's in here

```
generate.py                         seeded generator (edit CUSTOMERS to add/tweak)
carbon_reporting.sqlite             the storage schema, fully populated (12 MB)
api/co2_total.json                  ← GET /co2/total
api/customers/index.json            convenience customer list (not in the contract)
api/customers/<id>/timeline.json    ← GET /co2/customers/{id}/timeline
raw/<id>_sample_15min.csv           first 2 days of 15-min rows, for eyeballing
```

### SQLite (`carbon_reporting.sqlite`)

Exactly the four tables from the plan:

- `customer(customer_id, name, location, country, steering_start_date, last_ingested_utc)`
- `asset(asset_id, customer_id, asset_type)` — `GRID_CONNECTION` / `BATTERY`, EAN-/code-style IDs echoing the Hegg sheet names
- `customer_timeseries(customer_id, datetime_utc, grid_consumption_kwh, grid_injection_kwh, battery_charge_kwh, battery_discharge_kwh, carbon_intensity_gco2_kwh, co2_with_g, co2_without_g, co2_saved_g)` — 15-min raw inputs **and** computed CO₂
- `market_data(country, datetime_utc, carbon_intensity_gco2_kwh)` — one intensity series per country, shared by all its customers

### API fixtures (the frontend contract)

`api/customers/<id>/timeline.json`:

```jsonc
{
  "customer_id": "...", "name": "Polderwatt Energieopslag", "steering_start_date": "2026-01-01",
  "series": [
    { "date": "2026-01-01", "co2_with_kg": 61.89, "co2_without_kg": 105.77,
      "co2_saved_kg": 43.87, "cum_saved_kg": 43.87 }
    // ... one row per day, cum_saved_kg accumulates
  ],
  "totals": { "co2_with_kg": ..., "co2_without_kg": ..., "co2_saved_kg": ...,
              "co2_saved_tonnes": ..., "pct_reduction": ..., "from": ..., "to": ...,
              "n_batteries": ... }
}
```

`api/co2_total.json`: `{ "since", "total_co2_saved_tonnes", "customer_count" }`.

## Methodology (verbatim from the plan, applied per 15-min interval)

```
grid_net      = grid_consumption - grid_injection      # actual, WITH battery
battery_net   = battery_charge   - battery_discharge   # + = charging
baseline_net  = grid_net - battery_net                 # battery backed out
co2_with_g    = grid_net     * intensity               # actuals
co2_without_g = baseline_net * intensity               # counterfactual
co2_saved_g   = co2_without_g - co2_with_g  =  (discharge - charge) * intensity
```

Savings are net-positive because the battery **charges in low-intensity hours**
(midday solar trough / overnight) and **discharges in high-intensity hours**
(evening peak). Aggregate in grams, then `/1000 → kg`, `/1e6 → tonnes`.

This is the same arithmetic the Hegg Excel uses: its *“Baseline (no battery)”*
column is `co2_without`, its *“With Battery”* column is `co2_with`, and
`saved = without − with` — verified against that workbook's Summary totals.

Carbon intensity is modelled per country (NL gas-heavy ≈ higher, BE
nuclear-heavy ≈ lower; both fall Jan→Jun as renewables grow) with a diurnal
shape that dips midday and peaks in the evening, plus per-day weather noise.
In production this comes from Green Grid Compass (traxes.io); here it's synthetic.

## Verified invariants

`generate.py`'s output was checked: across all 48,000 rows,
`co2_saved_g == co2_without_g − co2_with_g` and
`== (discharge − charge) × intensity` (0 violations); every customer has 0
negative-savings *days*, a monotonic `cum_saved_kg`, and `cum_saved_kg[-1] == totals.co2_saved_kg`.
