import { ArrowDown } from "lucide-react";
import type { EmissionsData } from "@/lib/types";
import { formatGt, formatPercentInt, formatPerCapita } from "@/lib/format";
import { HeroBackdrop } from "@/components/viz/hero-backdrop";
import { AnimatedStat } from "@/components/viz/animated-stat";

export function Hero({ data }: { data: EmissionsData }) {
  const last = data.regionTrend.rows[data.regionTrend.rows.length - 1];
  const global = data.regionTrend.regions.reduce(
    (s, r) => s + (last[r] ?? 0),
    0,
  );
  const top3 = data.countries
    .filter((c) => c.region !== "Other")
    .slice(0, 3)
    .reduce((s, c) => s + c.share_global_pct, 0);
  const perCapita =
    data.countries.reduce((s, c) => s + c.co2_mt, 0) /
    data.countries.reduce((s, c) => s + c.population_millions, 0);

  const stats = [
    { value: global, format: formatGt, label: "CO₂ emitted worldwide in 2022" },
    {
      value: top3,
      format: (n: number) => formatPercentInt(n),
      label: "comes from just three countries",
    },
    {
      value: perCapita,
      format: formatPerCapita,
      label: "emitted per person, every year",
    },
  ];

  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0">
        <HeroBackdrop data={data.regionTrend} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-28 sm:px-8">
        <div className="reveal is-visible">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-accent-brand" />
            Emissions Atlas · 1950–2022
          </p>

          <h1 className="mt-7 max-w-4xl font-display text-6xl font-medium leading-[0.98] tracking-tight text-balance text-foreground sm:text-7xl md:text-8xl">
            Carbon,
            <br className="hidden sm:block" /> to{" "}
            <span className="italic text-accent-brand">zero.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A visual atlas of where the world&rsquo;s CO₂ comes from — who emits
            it, how it has grown across seven decades, and the distance still
            left to net&nbsp;zero.
          </p>
        </div>

        {/* KPI strip */}
        <div className="mt-16 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 bg-card/40 px-6 py-7 backdrop-blur-sm"
            >
              <AnimatedStat
                value={s.value}
                format={s.format}
                className="tabular font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl"
              />
              <span className="text-sm leading-snug text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#trajectory"
        className="group absolute inset-x-0 bottom-8 z-10 mx-auto hidden w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:flex"
      >
        Explore the data
        <ArrowDown className="size-3.5 animate-bounce [animation-duration:1.8s]" />
      </a>
    </section>
  );
}
