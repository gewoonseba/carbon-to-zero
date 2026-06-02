"use client";

import { useState, type CSSProperties } from "react";
import type { EmissionsData } from "@/lib/types";
import { VizConfigProvider } from "@/components/viz/viz-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ControlPanel } from "@/components/control-panel";
import { Section } from "@/components/section";
import { Hero } from "@/components/sections/hero";
import { GlobalTrendArea } from "@/components/viz/global-trend-area";
import { EmittersTreemap } from "@/components/viz/emitters-treemap";
import { RankingBars } from "@/components/viz/ranking-bars";
import { SectorWaffle } from "@/components/viz/sector-waffle";

export function CarbonStory({ data }: { data: EmissionsData }) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <VizConfigProvider>
      <SiteHeader onCustomize={() => setPanelOpen(true)} />

      <main id="top">
        <Hero data={data} />

        <Section
          id="trajectory"
          index="01"
          eyebrow="The climb"
          title="Seven decades of relentless growth."
          lede="Fossil-fuel CO₂ has risen more than six-fold since 1950. The line dips only at moments of crisis — the Soviet collapse, the 2008 crash, the pandemic — before resuming its climb."
          source="Source shape: Our World in Data / Global Carbon Project. Figures illustrative."
        >
          <GlobalTrendArea data={data.regionTrend} />
        </Section>

        <Section
          id="emitters"
          index="02"
          eyebrow="The big emitters"
          title="A handful of nations dominate."
          lede="Each rectangle is a country, sized by its annual emissions and coloured by region. China and the United States alone account for nearly half of the world's output."
          source="2022 territorial fossil-CO₂ emissions. Area ∝ million tonnes."
        >
          <EmittersTreemap data={data.countries} />
        </Section>

        <Section
          id="per-person"
          index="03"
          eyebrow="A fairer measure"
          title="Per person, the ranking flips."
          lede="Switch the metric and the story changes. Measured per resident, it's the small, wealthy petro-states and high-consumption economies that top the table — not the largest national totals."
          source="Toggle between total and per-capita emissions. Dashed line marks the global average."
        >
          <RankingBars data={data.countries} />
        </Section>

        <Section
          id="sectors"
          index="04"
          eyebrow="Anatomy of emissions"
          title="Where the carbon actually comes from."
          lede="Every square is one percent of global emissions, grouped by the activity that produces it. Electricity and heat lead — but transport, industry and land use together rival them."
          source="Approximate global greenhouse-gas split by sector. Each square ≈ 1%."
        >
          <SectorWaffle data={data.sectors} />
        </Section>

        {/* closing */}
        <section className="relative overflow-hidden">
          <div
            className="gradient-glow pointer-events-none absolute inset-0"
            style={
              {
                "--grad-y": "10%",
                "--grad-height": "120%",
                "--grad-size": "120%",
              } as CSSProperties
            }
          />
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-28 sm:px-8 md:py-40">
            <div className="reveal is-visible mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-brand">
              The road ahead
            </p>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight tracking-[-0.025em] text-balance text-foreground sm:text-5xl md:text-6xl">
              From thirty-seven gigatonnes,{" "}
              <span className="text-brand-gradient">to zero.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Reaching net zero means bending every curve on this page back to
              the baseline within a single generation. The data shows the scale
              of the climb — and exactly where the work begins.
            </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <ControlPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </VizConfigProvider>
  );
}
