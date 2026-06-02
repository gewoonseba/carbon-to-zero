import type { CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { timeFormat } from "d3";
import type { SavingsData } from "@/lib/types";
import { formatTonnes, formatInt, formatPercentInt } from "@/lib/format";
import { HeroBackdrop } from "@/components/viz/hero-backdrop";
import { AnimatedStat } from "@/components/viz/animated-stat";

const sinceLabel = timeFormat("%B %Y");

export function Hero({ data }: { data: SavingsData }) {
  const { fleet } = data;
  const since = sinceLabel(new Date(`${fleet.since}T00:00:00Z`));

  const stats = [
    {
      value: fleet.totalSavedTonnes,
      format: formatTonnes,
      label: `CO₂ kept out of the grid since ${since}`,
    },
    {
      value: fleet.batteryCount,
      format: formatInt,
      label: `batteries steered across ${fleet.customerCount} customer sites`,
    },
    {
      value: fleet.bestReductionPct,
      format: formatPercentInt,
      label: "emissions cut at our best-steered site",
    },
  ];

  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="gradient-glow absolute inset-0"
          style={
            {
              "--grad-y": "-16%",
              "--grad-height": "84%",
              "--grad-size": "135%",
            } as CSSProperties
          }
        />
        <div className="bg-grid absolute inset-0 opacity-70" />
        <HeroBackdrop points={data.fleetTrend} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-28 sm:px-8">
        <div className="reveal is-visible">
          <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-brand">
            <span className="inline-block size-1.5 rounded-full bg-accent-brand" />
            Companion Energy · CO₂ avoided since {since}
          </p>

          <h1 className="mt-7 max-w-4xl font-display text-6xl font-medium leading-[0.98] tracking-[-0.03em] text-balance text-foreground sm:text-7xl md:text-8xl">
            Steering carbon
            <br className="hidden sm:block" /> to{" "}
            <span className="text-brand-gradient">zero.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            We orchestrate our customers&rsquo; batteries to charge on clean
            power and discharge when the grid is dirtiest. This is the carbon
            that never reached the atmosphere &mdash; and the sites making it
            happen.
          </p>
        </div>

        {/* KPI strip */}
        <div className="mt-16 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-brand sm:grid-cols-3">
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
        href="#savings"
        className="group absolute inset-x-0 bottom-8 z-10 mx-auto hidden w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:flex"
      >
        See the savings
        <ArrowDown className="size-3.5 animate-bounce [animation-duration:1.8s]" />
      </a>
    </section>
  );
}
