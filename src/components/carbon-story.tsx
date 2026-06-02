"use client";

import { useState, type CSSProperties } from "react";
import type { SavingsData } from "@/lib/types";
import { formatTonnes } from "@/lib/format";
import { VizConfigProvider } from "@/components/viz/viz-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ControlPanel } from "@/components/control-panel";
import { Section } from "@/components/section";
import { Hero } from "@/components/sections/hero";
import { SavingsArea } from "@/components/viz/savings-area";
import { SaversTreemap } from "@/components/viz/savers-treemap";
import { RankingBars } from "@/components/viz/ranking-bars";
import { SavingsWaffle } from "@/components/viz/savings-waffle";
import { CarsEquivalent } from "@/components/viz/cars-equivalent";

export function CarbonStory({ data }: { data: SavingsData }) {
  const [panelOpen, setPanelOpen] = useState(false);

  // Onboarding milestones for the savings curve — one marker per customer.
  const annotations = [...data.customers]
    .sort((a, b) => a.steeringStart.localeCompare(b.steeringStart))
    .map((c) => ({ date: c.steeringStart, label: c.name.split(" ")[0] }));

  return (
    <VizConfigProvider>
      <SiteHeader onCustomize={() => setPanelOpen(true)} />

      <main id="top">
        <Hero data={data} />

        <Section
          id="savings"
          index="01"
          eyebrow="The savings curve"
          title="Every day, the avoided carbon adds up."
          lede="Each band is one customer. As we steer more batteries — charging on clean power, discharging when the grid is dirtiest — the carbon they never emit accumulates, day after day, toward the fleet total."
          source="Cumulative CO₂ saved, stacked by customer. Avoided emissions = (battery discharge − charge) × grid carbon intensity. Dashed lines mark each customer's steering start."
        >
          <SavingsArea data={data.trend} annotations={annotations} />
        </Section>

        <Section
          id="savers"
          index="02"
          eyebrow="The biggest savers"
          title="A few sites do the heavy lifting."
          lede="Each rectangle is a customer, sized by the tonnes of CO₂ we've helped them avoid and coloured by country. A single grid-scale battery in the Netherlands saves more than every other site combined."
          source="Area ∝ tonnes CO₂ saved since steering began."
        >
          <SaversTreemap data={data.customers} />
        </Section>

        <Section
          id="efficiency"
          index="03"
          eyebrow="A fairer measure"
          title="Per unit of energy, the ranking flips."
          lede="Switch from total tonnes to the share of emissions cut, and the story changes. The grid-scale battery still leads, but a small commercial solar site overtakes a much larger residential fleet — steering a dedicated asset hard beats spreading effort thin."
          source="Toggle between total saved and percentage reduction. Dashed line marks the fleet-wide reduction."
        >
          <RankingBars data={data.customers} />
        </Section>

        <Section
          id="mix"
          index="04"
          eyebrow="Anatomy of the savings"
          title="What kind of steering saves the carbon."
          lede="Every square is one percent of all the CO₂ we've saved, grouped by the type of asset behind it. Grid-scale storage, residential virtual power plants and commercial solar each pull their weight differently."
          source="Each square ≈ 1% of fleet CO₂ saved. Grouped by asset profile."
        >
          <SavingsWaffle data={data.customers} />
        </Section>

        <Section
          id="cars"
          index="05"
          eyebrow="In human terms"
          title={
            <>
              Picture the savings as{" "}
              <span className="text-brand-gradient">cars off the road</span>.
            </>
          }
          lede="A tonne of CO₂ is impossible to feel. So here's the fleet's whole avoided total translated into a unit everyone knows — the petrol car — using the EPA's standard yardstick for a year of driving."
          source="1 car ≈ 4.6 t CO₂/year (US EPA, typical passenger vehicle). Driving and fuel equivalents use ≈18,500 km/car/year and 2.31 kg CO₂/L of petrol; Earth's circumference is 40,075 km."
        >
          <CarsEquivalent tonnes={data.fleet.totalSavedTonnes} />
        </Section>

        {/* closing */}
        <section className="bg-background relative overflow-hidden">
          <div
            className="gradient-glow pointer-events-none absolute inset-0"
            style={
              {
                "--grad-x": "50%",
                "--grad-y": "50%",
                "--grad-height": "64%",
                "--grad-size": "70%",
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
                {formatTonnes(data.fleet.totalSavedTonnes)} saved so far.{" "}
                <span className="text-brand-gradient">Just the start.</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Every battery we bring online bends a little more carbon out of
                the grid. Scale the fleet from {data.fleet.batteryCount} batteries
                to thousands, and the same arithmetic — clean in, dirty out —
                turns these tonnes into megatonnes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter fleet={data.fleet} />

      <ControlPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </VizConfigProvider>
  );
}
