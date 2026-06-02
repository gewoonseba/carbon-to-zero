"use client";

import { useMemo } from "react";
import { formatInt, formatTonnes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { useVizConfig } from "./viz-config";
import { AnimatedStat } from "./animated-stat";
import { CarIcon } from "./car-icon";

/* ---- conversion factors (cited in the section's source line) ------------- */
// A typical US passenger vehicle, per the EPA greenhouse-gas equivalencies.
const T_CO2_PER_CAR_YEAR = 4.6;
// 4.6 t/yr ≈ 11,500 mi/yr of driving = 18,507 km/yr.
const KM_PER_CAR_YEAR = 18507;
// Burning one litre of petrol releases ~2.31 kg CO₂.
const KG_CO2_PER_LITRE_PETROL = 2.31;
// Earth's circumference at the equator.
const EARTH_CIRCUMFERENCE_KM = 40075;

// Car glyph aspect is 12:23 — these keep width ∝ height at each breakpoint.
const ICON_SIZE = "h-[92px] w-[48px] sm:h-[116px] sm:w-[61px]";

/** #rrggbb → rgba() with the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Recasts the fleet's total avoided CO₂ as something tangible: petrol cars
 * taken off the road for a year. Each glyph is one car; the trailing car fills
 * only to the fractional remainder, so the pictogram stays honest to the data.
 */
export function CarsEquivalent({ tonnes }: { tonnes: number }) {
  const { palette, config } = useVizConfig();
  const { ref, inView } = useInView<HTMLDivElement>();
  const animate = config.animate && inView;
  // When motion is off, fills sit at their final level immediately.
  const shown = animate || !config.animate;

  const { cars, whole, frac, km, litres, laps } = useMemo(() => {
    const cars = tonnes / T_CO2_PER_CAR_YEAR;
    return {
      cars,
      whole: Math.floor(cars),
      frac: cars - Math.floor(cars),
      km: cars * KM_PER_CAR_YEAR,
      litres: (tonnes * 1000) / KG_CO2_PER_LITRE_PETROL,
      laps: (cars * KM_PER_CAR_YEAR) / EARTH_CIRCUMFERENCE_KM,
    };
  }, [tonnes]);

  // whole filled cars + one partial car for the remainder (if non-trivial)
  const fills = useMemo(() => {
    const arr = Array.from({ length: whole }, () => 1);
    if (frac > 0.02) arr.push(frac);
    return arr;
  }, [whole, frac]);

  const accent = palette.accent;
  const ghost = withAlpha(accent, 0.14);
  const glow = withAlpha(accent, 0.5);

  const stats = [
    {
      value: roundTo(km, 1000),
      format: (n: number) => `${formatInt(n)} km`,
      label: "of driving avoided",
      sub: "the distance those cars would clock in a year",
    },
    {
      value: roundTo(litres, 50),
      format: (n: number) => `${formatInt(n)} L`,
      label: "of petrol left unburned",
      sub: "fuel that never made it to a tank",
    },
    {
      value: laps,
      format: (n: number) => `${n.toFixed(1)}×`,
      label: "around the Earth",
      sub: "that same distance, measured at the equator",
    },
  ];

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-brand sm:p-10"
    >
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        {/* headline number + copy */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-light text-muted-foreground sm:text-4xl">
              ≈
            </span>
            <span className="text-brand-gradient font-display text-[clamp(3.25rem,8vw,5.5rem)] font-medium leading-none tracking-[-0.04em]">
              <AnimatedStat value={cars} format={(n) => n.toFixed(1)} />
            </span>
          </div>
          <p className="mt-3 text-lg font-medium leading-snug text-foreground sm:text-xl">
            petrol cars taken off the road for a full year
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tonnes of CO₂ are hard to picture. So here is the same number in
            something you can: the {formatTonnes(tonnes)} we&apos;ve kept out of
            the grid is the exhaust of {cars.toFixed(1)} cars, parked for twelve
            months straight.
          </p>
        </div>

        {/* car pictogram */}
        <div className="relative">
          {/* soft accent bloom behind the cars */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-70"
            style={{
              background: `radial-gradient(60% 70% at 50% 60%, ${withAlpha(
                accent,
                0.22,
              )}, transparent 70%)`,
            }}
          />
          <div
            className="flex items-end justify-center gap-3 sm:gap-5"
            role="img"
            aria-label={`Pictogram of ${cars.toFixed(
              1,
            )} cars, where each icon is one car`}
          >
            {fills.map((fillFraction, i) => (
              <div key={i} className={cn("relative", ICON_SIZE)}>
                {/* unfilled silhouette */}
                <CarIcon className="absolute inset-0 h-full w-full" fill={ghost} />
                {/* fill, revealed bottom-up to the car's fraction */}
                <div
                  className="absolute inset-x-0 bottom-0 overflow-hidden"
                  style={{
                    height: shown ? `${fillFraction * 100}%` : "0%",
                    transition: config.animate
                      ? `height 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 140}ms`
                      : undefined,
                  }}
                >
                  <CarIcon
                    className={cn("absolute bottom-0 left-0", ICON_SIZE)}
                    fill={accent}
                    style={{ filter: `drop-shadow(0 1px 7px ${glow})` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground/70">
            Each icon = 1 car · 4.6 t CO₂ per car, per year (EPA)
          </p>
        </div>
      </div>

      {/* highlight numbers */}
      <div className="mt-9 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3 sm:gap-8">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1.5 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              <span className="text-base font-light text-muted-foreground">
                ≈
              </span>
              <AnimatedStat value={s.value} format={s.format} className="tabular" />
            </div>
            <div className="text-sm font-medium text-foreground/85">
              {s.label}
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground/65">
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
