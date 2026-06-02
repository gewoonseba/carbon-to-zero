"use client";

import { useMemo, useState } from "react";
import { scaleBand, scaleLinear, max } from "d3";
import type { CustomerSaving } from "@/lib/types";
import { rampOf } from "@/lib/palettes";
import { formatTonnes2, formatPercent } from "@/lib/format";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useVizConfig, type RankMetric } from "./viz-config";
import {
  ChartFrame,
  ChartTooltip,
  TooltipRow,
  TooltipTitle,
  type TooltipState,
} from "./chart-primitives";

export function RankingBars({ data }: { data: CustomerSaving[] }) {
  const { palette, config, update } = useVizConfig();
  const metric = config.rankMetric;
  const [hover, setHover] = useState<{
    c: CustomerSaving;
    x: number;
    y: number;
  } | null>(null);

  // Fleet-wide reduction = total avoided / total counterfactual.
  const fleetAvg = useMemo(() => {
    const saved = data.reduce((s, c) => s + c.savedKg, 0);
    const without = data.reduce((s, c) => s + c.withoutKg, 0);
    return without ? (saved / without) * 100 : 0;
  }, [data]);

  const value = (c: CustomerSaving) =>
    metric === "total" ? c.savedTonnes : c.pctReduction;
  const fmt = (c: CustomerSaving) =>
    metric === "total" ? formatTonnes2(c.savedTonnes) : formatPercent(c.pctReduction);

  const ranked = useMemo(
    () => [...data].sort((a, b) => value(b) - value(a)),
    [data, metric], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {metric === "total"
            ? "Ranked by total CO₂ avoided since steering began."
            : "Ranked by how much each site cut its own emissions — the order flips."}
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
            Total saved
          </ToggleGroupItem>
          <ToggleGroupItem value="percent" className="px-3 text-xs">
            % reduction
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ChartFrame aspect={0.5} minHeight={300} maxHeight={460}>
        {({ width, height, inView }) => {
          const m = { top: 6, right: 78, bottom: 22, left: 168 };
          const innerW = width - m.left - m.right;
          const innerH = height - m.top - m.bottom;

          const maxVal = max(ranked, value) ?? 1;
          const x = scaleLinear().domain([0, maxVal]).range([0, innerW]).nice();
          const yb = scaleBand<string>()
            .domain(ranked.map((c) => c.id))
            .range([m.top, m.top + innerH])
            .padding(0.34);

          const ramp = rampOf(palette);
          const animate = config.animate && inView;
          const xTicks = x.ticks(5);
          const avgX = metric === "percent" ? m.left + x(fleetAvg) : null;

          return (
            <>
              <svg
                width={width}
                height={height}
                role="img"
                aria-label="Ranked bar chart of CO₂ saved by customer"
              >
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
                    {metric === "total" ? t : `${t}%`}
                  </text>
                ))}

                {ranked.map((c, i) => {
                  const by = yk(yb, c.id);
                  const bh = yb.bandwidth();
                  const target = x(value(c));
                  const t = 0.32 + 0.68 * (value(c) / maxVal);
                  const fill = ramp(t);
                  const isHover = hover?.c.id === c.id;
                  const w = animate || !config.animate ? target : 0;
                  return (
                    <g
                      key={c.id}
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
                        {c.name}
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

                {/* fleet-average reference (percent only) */}
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
                      fleet avg {fleetAvg.toFixed(0)}%
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
                          <TooltipTitle>{hover.c.name}</TooltipTitle>
                          <TooltipRow
                            label="CO₂ saved"
                            value={formatTonnes2(hover.c.savedTonnes)}
                          />
                          <TooltipRow
                            label="Emissions cut"
                            value={formatPercent(hover.c.pctReduction)}
                          />
                          <TooltipRow
                            label="Profile"
                            value={hover.c.profileLabel}
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
