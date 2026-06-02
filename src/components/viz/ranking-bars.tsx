"use client";

import { useMemo, useState } from "react";
import { scaleBand, scaleLinear, max } from "d3";
import type { CountryEmission } from "@/lib/types";
import { rampOf } from "@/lib/palettes";
import { formatMtRaw, formatPerCapita, formatPercent } from "@/lib/format";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useVizConfig, type RankMetric } from "./viz-config";
import {
  ChartFrame,
  ChartTooltip,
  TooltipRow,
  TooltipTitle,
  type TooltipState,
} from "./chart-primitives";

export function RankingBars({ data }: { data: CountryEmission[] }) {
  const { palette, config, update } = useVizConfig();
  const metric = config.rankMetric;
  const [hover, setHover] = useState<{
    c: CountryEmission;
    x: number;
    y: number;
  } | null>(null);

  const worldAvg = useMemo(() => {
    const co2 = data.reduce((s, c) => s + c.co2_mt, 0);
    const pop = data.reduce((s, c) => s + c.population_millions, 0);
    return co2 / pop;
  }, [data]);

  const ranked = useMemo(() => {
    const value = (c: CountryEmission) =>
      metric === "total" ? c.co2_mt : c.co2_per_capita_t;
    return [...data]
      .filter((c) => c.region !== "Other")
      .sort((a, b) => value(b) - value(a))
      .slice(0, config.topN);
  }, [data, metric, config.topN]);

  const value = (c: CountryEmission) =>
    metric === "total" ? c.co2_mt : c.co2_per_capita_t;
  const fmt = (c: CountryEmission) =>
    metric === "total" ? formatMtRaw(c.co2_mt) : formatPerCapita(c.co2_per_capita_t);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {metric === "total"
            ? "Ranked by total national emissions."
            : "Ranked by emissions per person — the picture inverts."}
        </p>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={metric}
          onValueChange={(v) => v && update({ rankMetric: v as RankMetric })}
          className="bg-card/60"
        >
          <ToggleGroupItem value="total" className="px-3 text-xs">
            Total
          </ToggleGroupItem>
          <ToggleGroupItem value="perCapita" className="px-3 text-xs">
            Per person
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ChartFrame
        aspect={config.topN > 10 ? 0.85 : 0.62}
        minHeight={360}
        maxHeight={720}
      >
        {({ width, height, inView }) => {
          const m = { top: 6, right: 70, bottom: 22, left: 132 };
          const innerW = width - m.left - m.right;
          const innerH = height - m.top - m.bottom;

          const maxVal = max(ranked, value) ?? 1;
          const x = scaleLinear().domain([0, maxVal]).range([0, innerW]).nice();
          const yb = scaleBand<string>()
            .domain(ranked.map((c) => c.country))
            .range([m.top, m.top + innerH])
            .padding(0.34);

          const ramp = rampOf(palette);
          const animate = config.animate && inView;
          const xTicks = x.ticks(5);
          const avgX = metric === "perCapita" ? m.left + x(worldAvg) : null;

          return (
            <>
              <svg width={width} height={height} role="img" aria-label="Ranked bar chart of CO₂ emissions">
                {/* vertical gridlines */}
                {config.showGrid &&
                  xTicks.map((t) => (
                    <line
                      key={t}
                      x1={m.left + x(t)}
                      x2={m.left + x(t)}
                      y1={m.top}
                      y2={m.top + innerH}
                      className="stroke-white/[0.05]"
                    />
                  ))}

                {/* x ticks */}
                {xTicks.map((t) => (
                  <text
                    key={t}
                    x={m.left + x(t)}
                    y={m.top + innerH + 15}
                    textAnchor="middle"
                    className="tabular fill-muted-foreground text-[10px]"
                  >
                    {t}
                  </text>
                ))}

                {ranked.map((c, i) => {
                  const by = yk(yb, c.country);
                  const bh = yb.bandwidth();
                  const target = x(value(c));
                  const t = 0.32 + 0.68 * (value(c) / maxVal);
                  const fill = ramp(t);
                  const isHover = hover?.c.country === c.country;
                  const w = animate || !config.animate ? target : 0;
                  return (
                    <g
                      key={c.country}
                      onMouseEnter={(e) => {
                        const r =
                          e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                        setHover({ c, x: e.clientX - r.left, y: e.clientY - r.top });
                      }}
                      onMouseMove={(e) => {
                        const r =
                          e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                        setHover({ c, x: e.clientX - r.left, y: e.clientY - r.top });
                      }}
                      onMouseLeave={() => setHover(null)}
                    >
                      {/* track */}
                      <rect
                        x={m.left}
                        y={by}
                        width={innerW}
                        height={bh}
                        rx={4}
                        className="fill-white/[0.03]"
                      />
                      {/* label */}
                      <text
                        x={m.left - 12}
                        y={by + bh / 2}
                        dy="0.32em"
                        textAnchor="end"
                        className="fill-foreground/90 text-xs font-medium"
                      >
                        {c.country}
                      </text>
                      {/* bar */}
                      <rect
                        x={m.left}
                        y={by}
                        height={bh}
                        rx={4}
                        fill={fill}
                        fillOpacity={isHover ? 1 : 0.92}
                        style={{
                          width: w,
                          transition: config.animate
                            ? `width 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 28}ms`
                            : undefined,
                        }}
                      />
                      {/* value */}
                      {config.showValues && (
                        <text
                          x={m.left + target + 9}
                          y={by + bh / 2}
                          dy="0.32em"
                          className="tabular fill-foreground/80 text-[11px] font-semibold"
                          style={{
                            opacity: animate || !config.animate ? 1 : 0,
                            transition: config.animate
                              ? `opacity 0.4s ease ${i * 28 + 500}ms`
                              : undefined,
                          }}
                        >
                          {fmt(c)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* world-average reference (per-capita only) */}
                {config.showAnnotations && avgX != null && (
                  <g className="pointer-events-none">
                    <line
                      x1={avgX}
                      x2={avgX}
                      y1={m.top - 2}
                      y2={m.top + innerH}
                      stroke={palette.accent}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={avgX}
                      y={m.top + innerH + 15}
                      textAnchor="middle"
                      className="text-[10px] font-medium"
                      fill={palette.accent}
                    >
                      world avg {worldAvg.toFixed(1)}t
                    </text>
                  </g>
                )}
              </svg>

              {hover && (
                <ChartTooltip
                  containerWidth={width}
                  tooltip={
                    {
                      x: hover.x,
                      y: hover.y,
                      content: (
                        <div className="flex flex-col gap-1">
                          <TooltipTitle>{hover.c.country}</TooltipTitle>
                          <TooltipRow
                            label="Per person"
                            value={formatPerCapita(hover.c.co2_per_capita_t)}
                          />
                          <TooltipRow
                            label="Total"
                            value={formatMtRaw(hover.c.co2_mt)}
                          />
                          <TooltipRow
                            label="Share of world"
                            value={formatPercent(hover.c.share_global_pct)}
                          />
                        </div>
                      ),
                    } as TooltipState
                  }
                />
              )}
            </>
          );
        }}
      </ChartFrame>
    </div>
  );
}

// scaleBand returns number | undefined; this narrows it for layout maths.
function yk(scale: ReturnType<typeof scaleBand<string>>, key: string): number {
  return scale(key) ?? 0;
}
