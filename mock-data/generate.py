#!/usr/bin/env python3
"""
Generate mock CO2-savings data for several customers.

Conforms to the "Carbon Reporting" schema (shares/2026-06-02-co2-savings-plan) and
is calibrated to the real Hegg fleet Excel (Hegg_C022_savings_all_sites.xlsx).

Methodology (per customer, per 15-min interval), straight from the plan:
    grid_net      = grid_consumption - grid_injection          # actual, WITH battery
    battery_net   = battery_charge   - battery_discharge        # + = charging
    baseline_net  = grid_net - battery_net                      # battery backed out
    co2_with_g    = grid_net      * intensity_gco2_kwh
    co2_without_g = baseline_net  * intensity_gco2_kwh
    co2_saved_g   = co2_without_g - co2_with_g = (discharge - charge) * intensity

Savings are net-positive because the battery charges in low-intensity hours
(midday solar / overnight) and discharges in high-intensity hours (evening peak).

Stdlib only — no openpyxl / pandas / numpy on this machine.
Deterministic: fixed RNG seed per customer, so re-runs are byte-identical.

Outputs (under mock-data/):
    carbon_reporting.sqlite              storage schema (customer / asset /
                                         customer_timeseries / market_data)
    api/co2_total.json                   GET /co2/total
    api/customers/index.json             convenience customer list (not in contract)
    api/customers/<id>/timeline.json     GET /co2/customers/{id}/timeline
    raw/<id>_sample_15min.csv            first 2 days of 15-min rows, for eyeballing
"""

from __future__ import annotations

import csv
import json
import math
import os
import random
import sqlite3
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(HERE, "api")
RAW_DIR = os.path.join(HERE, "raw")
DB_PATH = os.path.join(HERE, "carbon_reporting.sqlite")

# Whole-fleet reporting window. Today (per session) is 2026-06-02; we stop at
# the day before so every series ends on a complete day.
WINDOW_END = datetime(2026, 6, 1, tzinfo=timezone.utc)
STEP = timedelta(minutes=15)
DAY_STEPS = 96
ROUND_TRIP_EFFICIENCY = 0.91  # discharge energy / charge energy over a day


# --------------------------------------------------------------------------- #
# Carbon intensity model (gCO2eq / kWh), per country.                         #
# --------------------------------------------------------------------------- #
# Diurnal multiplier: dips midday (solar floods the grid), peaks in the        #
# evening ramp. Same shape both countries; the seasonal baseline differs       #
# (NL gas-heavy ~higher, BE nuclear-heavy ~lower), both falling Jan->Jun as     #
# renewables grow.                                                             #
COUNTRY_INTENSITY = {
    # country: (winter_base, summer_base)  gCO2/kWh
    "NL": (360.0, 250.0),
    "BE": (210.0, 145.0),
}


def diurnal_multiplier(hour: float) -> float:
    midday_dip = -0.22 * math.exp(-((hour - 13.0) ** 2) / (2 * 2.5 ** 2))
    evening_peak = 0.20 * math.exp(-((hour - 19.0) ** 2) / (2 * 2.0 ** 2))
    morning_shoulder = 0.06 * math.exp(-((hour - 8.0) ** 2) / (2 * 1.5 ** 2))
    return 1.0 + midday_dip + evening_peak + morning_shoulder


def seasonal_base(country: str, frac: float) -> float:
    """frac in [0,1] from Jan 1 to Jun 1 (linear winter->late-spring)."""
    winter, summer = COUNTRY_INTENSITY[country]
    return winter + (summer - winter) * frac


def build_market_data(country: str, start: datetime, end: datetime, rng: random.Random):
    """One intensity series per country, shared by every customer in it."""
    total_days = (WINDOW_END - datetime(2026, 1, 1, tzinfo=timezone.utc)).days
    # Per-day weather factor: windy days are cleaner, calm days dirtier.
    series = {}
    t = start
    weather_by_day = {}
    while t < end:
        day_key = t.date()
        if day_key not in weather_by_day:
            weather_by_day[day_key] = 1.0 + rng.uniform(-0.18, 0.18)
        days_since_jan1 = (t - datetime(2026, 1, 1, tzinfo=timezone.utc)).days
        frac = max(0.0, min(1.0, days_since_jan1 / total_days))
        base = seasonal_base(country, frac)
        hour = t.hour + t.minute / 60.0
        intensity = base * diurnal_multiplier(hour) * weather_by_day[day_key]
        intensity *= 1.0 + rng.uniform(-0.03, 0.03)  # 15-min jitter
        series[t] = round(max(40.0, intensity), 3)
        t += STEP
    return series


# --------------------------------------------------------------------------- #
# Intraday shape weights (per 15-min slot, normalised to 1.0 over a day).      #
# --------------------------------------------------------------------------- #
def _normalised_day_shape(fn):
    raw = [fn((q / 4.0)) for q in range(DAY_STEPS)]
    total = sum(raw)
    return [v / total for v in raw]


LOAD_SHAPE = _normalised_day_shape(
    lambda h: 0.45
    + 0.55 * math.exp(-((h - 7.5) ** 2) / (2 * 1.6 ** 2))
    + 0.95 * math.exp(-((h - 19.0) ** 2) / (2 * 2.1 ** 2))
)
SOLAR_SHAPE = _normalised_day_shape(
    lambda h: math.exp(-((h - 13.0) ** 2) / (2 * 3.2 ** 2)) if 4.5 < h < 21.5 else 0.0
)
CHARGE_SHAPE = _normalised_day_shape(
    lambda h: math.exp(-((h - 13.0) ** 2) / (2 * 2.4 ** 2))
    + 0.55 * math.exp(-((h - 3.0) ** 2) / (2 * 1.8 ** 2))
)
DISCHARGE_SHAPE = _normalised_day_shape(
    lambda h: math.exp(-((h - 19.0) ** 2) / (2 * 2.2 ** 2))
    + 0.40 * math.exp(-((h - 7.5) ** 2) / (2 * 1.2 ** 2))
)


def solar_peak_sun_hours(frac: float) -> float:
    """Daily PV yield (kWh per kWp) ramps ~1.2 (Jan) -> ~4.8 (late May), NW-Europe."""
    return 1.2 + 3.6 * frac


# --------------------------------------------------------------------------- #
# Customer fleet — deliberately varied profiles.                              #
# --------------------------------------------------------------------------- #
CUSTOMERS = [
    {
        "customer_id": "c0a1f2e3-1111-4aaa-8001-helios000001",
        "name": "Helios Buurtbatterij",
        "location": "Arnhem, NL",
        "country": "NL",
        "steering_start_date": "2026-01-15",
        "profile": "residential_vpp",
        "n_sites": 72,
        "load_kwh_day_site": 31.0,     # heat-pump + EV households, like Hegg
        "solar_kwp_site": 4.2,
        "battery_kwh_site": 8.0,
        "cycles_day": 1.6,
        "seed": 101,
    },
    {
        "customer_id": "c0a1f2e3-2222-4bbb-8002-polderwatt02",
        "name": "Polderwatt Energieopslag",
        "location": "Eemshaven, NL",
        "country": "NL",
        "steering_start_date": "2026-01-01",
        "profile": "single_ci_battery",
        "n_sites": 1,
        "load_kwh_day_site": 240.0,    # one industrial host site
        "solar_kwp_site": 0.0,         # no PV behind the steered connection
        "battery_kwh_site": 2000.0,    # one large steered battery
        "cycles_day": 1.15,
        "seed": 202,
    },
    {
        "customer_id": "c0a1f2e3-3333-4ccc-8003-brouwerij0003",
        "name": "Brouwerij De Vlaamse Leeuw",
        "location": "Leuven, BE",
        "country": "BE",
        "steering_start_date": "2026-02-01",
        "profile": "commercial_solar",
        "n_sites": 1,
        "load_kwh_day_site": 820.0,    # brewery
        "solar_kwp_site": 260.0,       # big rooftop array
        "battery_kwh_site": 500.0,
        "cycles_day": 1.05,
        "seed": 303,
    },
    {
        "customer_id": "c0a1f2e3-4444-4ddd-8004-groeneweide04",
        "name": "Groene Weide Coöperatie",
        "location": "Gent, BE",
        "country": "BE",
        "steering_start_date": "2026-03-01",
        "profile": "residential_vpp",
        "n_sites": 14,
        "load_kwh_day_site": 23.0,
        "solar_kwp_site": 3.6,
        "battery_kwh_site": 7.0,
        "cycles_day": 1.5,
        "seed": 404,
    },
]


# --------------------------------------------------------------------------- #
# Fake-but-plausible asset identifiers, echoing the Hegg Excel naming.        #
# --------------------------------------------------------------------------- #
FIRST_NAMES = [
    "Jan", "Sven", "Lotte", "Bram", "Emma", "Daan", "Sanne", "Tijs", "Noor",
    "Ruben", "Fleur", "Joris", "Maud", "Stijn", "Anouk", "Wouter", "Linde",
    "Koen", "Lieke", "Bas", "Tess", "Niels", "Roos", "Gijs", "Hanne", "Lars",
]
LAST_NAMES = [
    "de Vries", "Janssen", "Peeters", "Maes", "Bakker", "Visser", "Smit",
    "Claes", "Mertens", "Willems", "Hendrickx", "van Dijk", "Jacobs", "Aerts",
    "Wouters", "Goossens", "De Smet", "Dubois", "Vermeer", "Koster",
]


def gen_grid_connection_id(rng: random.Random) -> str:
    return "8716" + "".join(str(rng.randint(0, 9)) for _ in range(14))


def gen_battery_id(rng: random.Random, idx: int) -> str:
    style = rng.choice(["ALD", "EA", "AS", "ESL"])
    person = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
    if style == "ALD":
        return f"ALD0710{rng.randint(100000, 999999)} - {person}"
    if style == "EA":
        return f"EA0{rng.randint(10, 299)} - {person}"
    if style == "AS":
        return f"#AS0{rng.randint(10, 599)} - {person}"
    return f"ESL0503H{rng.randint(22430000, 22439999)} - {person}"


# --------------------------------------------------------------------------- #
# Per-customer 15-min generation.                                             #
# --------------------------------------------------------------------------- #
def generate_customer_timeseries(cust: dict, intensity_series: dict):
    rng = random.Random(cust["seed"])
    start = datetime.fromisoformat(cust["steering_start_date"]).replace(tzinfo=timezone.utc)
    n = cust["n_sites"]

    rows = []
    t = start
    total_days = (WINDOW_END - datetime(2026, 1, 1, tzinfo=timezone.utc)).days
    while t < WINDOW_END:
        days_since_jan1 = (t - datetime(2026, 1, 1, tzinfo=timezone.utc)).days
        frac = max(0.0, min(1.0, days_since_jan1 / total_days))

        # --- daily totals for the whole customer (all sites aggregated) ---
        load_seasonal = 1.0 + 0.18 * (1.0 - frac)        # a bit more load in winter
        day_load = n * cust["load_kwh_day_site"] * load_seasonal * (1 + rng.uniform(-0.06, 0.06))
        day_solar = (
            n * cust["solar_kwp_site"] * solar_peak_sun_hours(frac)
            * (1 + rng.uniform(-0.30, 0.20))            # cloud cover varies a lot
        )
        day_charge = n * cust["battery_kwh_site"] * cust["cycles_day"] * (1 + rng.uniform(-0.08, 0.08))
        day_discharge = day_charge * ROUND_TRIP_EFFICIENCY * (1 + rng.uniform(-0.04, 0.04))

        for q in range(DAY_STEPS):
            ts = t + q * STEP
            if ts >= WINDOW_END:
                break
            intensity = intensity_series[ts]  # gCO2/kWh

            load = day_load * LOAD_SHAPE[q]
            solar = day_solar * SOLAR_SHAPE[q]
            charge = day_charge * CHARGE_SHAPE[q]
            discharge = day_discharge * DISCHARGE_SHAPE[q]

            house_net = load - solar                  # baseline grid position (battery removed)
            battery_net = charge - discharge
            grid_net = house_net + battery_net         # actual grid position (with battery)

            if grid_net >= 0:
                grid_consumption, grid_injection = grid_net, 0.0
            else:
                grid_consumption, grid_injection = 0.0, -grid_net

            baseline_net = grid_net - battery_net      # == house_net
            co2_with_g = grid_net * intensity
            co2_without_g = baseline_net * intensity
            co2_saved_g = co2_without_g - co2_with_g   # = (discharge - charge) * intensity

            rows.append({
                "datetime_utc": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "grid_consumption_kwh": round(grid_consumption, 6),
                "grid_injection_kwh": round(grid_injection, 6),
                "battery_charge_kwh": round(charge, 6),
                "battery_discharge_kwh": round(discharge, 6),
                "carbon_intensity_gco2_kwh": round(intensity, 3),
                "co2_with_g": round(co2_with_g, 4),
                "co2_without_g": round(co2_without_g, 4),
                "co2_saved_g": round(co2_saved_g, 4),
            })
        t += timedelta(days=1)
    return rows


def roll_up_daily(rows: list[dict]) -> list[dict]:
    """15-min rows -> daily series for the API contract."""
    by_day: dict[str, dict] = {}
    for r in rows:
        day = r["datetime_utc"][:10]
        d = by_day.setdefault(day, {"with_g": 0.0, "without_g": 0.0, "saved_g": 0.0})
        d["with_g"] += r["co2_with_g"]
        d["without_g"] += r["co2_without_g"]
        d["saved_g"] += r["co2_saved_g"]

    series = []
    cum_saved_kg = 0.0
    for day in sorted(by_day):
        d = by_day[day]
        saved_kg = d["saved_g"] / 1000.0
        cum_saved_kg += saved_kg
        series.append({
            "date": day,
            "co2_with_kg": round(d["with_g"] / 1000.0, 3),
            "co2_without_kg": round(d["without_g"] / 1000.0, 3),
            "co2_saved_kg": round(saved_kg, 3),
            "cum_saved_kg": round(cum_saved_kg, 3),
        })
    return series


# --------------------------------------------------------------------------- #
# SQLite storage (matches the plan's schema).                                 #
# --------------------------------------------------------------------------- #
def create_db(conn: sqlite3.Connection):
    conn.executescript("""
        DROP TABLE IF EXISTS customer;
        DROP TABLE IF EXISTS asset;
        DROP TABLE IF EXISTS customer_timeseries;
        DROP TABLE IF EXISTS market_data;

        CREATE TABLE customer (
            customer_id TEXT PRIMARY KEY, name TEXT, location TEXT, country TEXT,
            steering_start_date TEXT, last_ingested_utc TEXT
        );
        CREATE TABLE asset (
            asset_id TEXT PRIMARY KEY, customer_id TEXT, asset_type TEXT
        );
        CREATE TABLE customer_timeseries (
            customer_id TEXT,
            datetime_utc TEXT,
            grid_consumption_kwh REAL,
            grid_injection_kwh REAL,
            battery_charge_kwh REAL,
            battery_discharge_kwh REAL,
            carbon_intensity_gco2_kwh REAL,
            co2_with_g REAL,
            co2_without_g REAL,
            co2_saved_g REAL,
            PRIMARY KEY (customer_id, datetime_utc)
        );
        CREATE TABLE market_data (
            country TEXT,
            datetime_utc TEXT,
            carbon_intensity_gco2_kwh REAL,
            PRIMARY KEY (country, datetime_utc)
        );
    """)


def main():
    os.makedirs(API_DIR, exist_ok=True)
    os.makedirs(os.path.join(API_DIR, "customers"), exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    create_db(conn)

    # --- market data per active country (shared) ---
    countries = sorted({c["country"] for c in CUSTOMERS})
    earliest = min(datetime.fromisoformat(c["steering_start_date"]).replace(tzinfo=timezone.utc)
                   for c in CUSTOMERS)
    intensity_by_country = {}
    for country in countries:
        md_rng = random.Random(hash(country) & 0xFFFF)
        series = build_market_data(country, earliest, WINDOW_END, md_rng)
        intensity_by_country[country] = series
        conn.executemany(
            "INSERT INTO market_data VALUES (?,?,?)",
            [(country, ts.strftime("%Y-%m-%dT%H:%M:%SZ"), v) for ts, v in series.items()],
        )
    conn.commit()

    fleet_saved_tonnes = 0.0
    summary_rows = []
    customer_index = []

    for cust in CUSTOMERS:
        intensity_series = intensity_by_country[cust["country"]]
        rows = generate_customer_timeseries(cust, intensity_series)

        # --- customer + asset metadata ---
        conn.execute(
            "INSERT INTO customer VALUES (?,?,?,?,?,?)",
            (cust["customer_id"], cust["name"], cust["location"], cust["country"],
             cust["steering_start_date"], WINDOW_END.strftime("%Y-%m-%dT%H:%M:%SZ")),
        )
        a_rng = random.Random(cust["seed"] + 7)
        assets = []
        for i in range(cust["n_sites"]):
            assets.append((gen_grid_connection_id(a_rng), cust["customer_id"], "GRID_CONNECTION"))
            assets.append((gen_battery_id(a_rng, i), cust["customer_id"], "BATTERY"))
        conn.executemany("INSERT OR IGNORE INTO asset VALUES (?,?,?)", assets)

        # --- 15-min timeseries ---
        conn.executemany(
            "INSERT INTO customer_timeseries VALUES (?,?,?,?,?,?,?,?,?,?)",
            [(cust["customer_id"], r["datetime_utc"], r["grid_consumption_kwh"],
              r["grid_injection_kwh"], r["battery_charge_kwh"], r["battery_discharge_kwh"],
              r["carbon_intensity_gco2_kwh"], r["co2_with_g"], r["co2_without_g"],
              r["co2_saved_g"]) for r in rows],
        )
        conn.commit()

        # --- API: timeline ---
        series = roll_up_daily(rows)
        total_with = round(sum(s["co2_with_kg"] for s in series), 3)
        total_without = round(sum(s["co2_without_kg"] for s in series), 3)
        total_saved = round(sum(s["co2_saved_kg"] for s in series), 3)
        totals = {
            "co2_with_kg": total_with,
            "co2_without_kg": total_without,
            "co2_saved_kg": total_saved,
            "co2_saved_tonnes": round(total_saved / 1000.0, 4),
            "pct_reduction": round(100.0 * total_saved / total_without, 2) if total_without else 0.0,
            "from": series[0]["date"],
            "to": series[-1]["date"],
            "n_batteries": cust["n_sites"],
        }
        timeline = {
            "customer_id": cust["customer_id"],
            "name": cust["name"],
            "steering_start_date": cust["steering_start_date"],
            "series": series,
            "totals": totals,
        }
        cust_dir = os.path.join(API_DIR, "customers", cust["customer_id"])
        os.makedirs(cust_dir, exist_ok=True)
        with open(os.path.join(cust_dir, "timeline.json"), "w") as f:
            json.dump(timeline, f, indent=2)

        # --- raw 15-min sample (first 2 days) ---
        sample = rows[: 2 * DAY_STEPS]
        with open(os.path.join(RAW_DIR, f"{cust['customer_id']}_sample_15min.csv"), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["datetime_utc", "grid_consumption_kwh",
                "grid_injection_kwh", "battery_charge_kwh", "battery_discharge_kwh",
                "carbon_intensity_gco2_kwh", "co2_with_g", "co2_without_g", "co2_saved_g"])
            w.writeheader()
            w.writerows(sample)

        fleet_saved_tonnes += totals["co2_saved_tonnes"]
        customer_index.append({
            "customer_id": cust["customer_id"], "name": cust["name"],
            "location": cust["location"], "country": cust["country"],
            "steering_start_date": cust["steering_start_date"],
            "profile": cust["profile"], "n_batteries": cust["n_sites"],
            "co2_saved_tonnes": totals["co2_saved_tonnes"],
        })
        summary_rows.append((cust["name"], cust["country"], cust["n_sites"],
                             len(rows), total_without, total_with, total_saved))

    # --- API: fleet total ---
    co2_total = {
        "since": min(c["steering_start_date"] for c in CUSTOMERS),
        "total_co2_saved_tonnes": round(fleet_saved_tonnes, 4),
        "customer_count": len(CUSTOMERS),
    }
    with open(os.path.join(API_DIR, "co2_total.json"), "w") as f:
        json.dump(co2_total, f, indent=2)
    with open(os.path.join(API_DIR, "customers", "index.json"), "w") as f:
        json.dump({"customers": customer_index}, f, indent=2)

    conn.close()

    # --- console summary ---
    print(f"DB: {DB_PATH}")
    print(f"Countries (market_data): {', '.join(countries)}")
    print(f"\n{'Customer':<32}{'Cty':<5}{'Bty':>5}{'rows':>9}"
          f"{'without_kg':>13}{'with_kg':>11}{'saved_kg':>11}")
    print("-" * 86)
    for name, cty, n, nrows, wo, wi, sv in summary_rows:
        print(f"{name:<32}{cty:<5}{n:>5}{nrows:>9}{wo:>13,.0f}{wi:>11,.0f}{sv:>11,.0f}")
    print("-" * 86)
    print(f"Fleet total CO2 saved since {co2_total['since']}: "
          f"{co2_total['total_co2_saved_tonnes']} tonnes "
          f"across {co2_total['customer_count']} customers")


if __name__ == "__main__":
    main()
