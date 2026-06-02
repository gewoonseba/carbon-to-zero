"use client";

import { useMemo, useState } from "react";
import { hierarchy, treemap } from "d3";
import type { CountryEmission } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatMtRaw, formatPercent, formatPerCapita } from "@/lib/format";
import { useVizConfig } from "./viz-config";
import {
  ChartFrame,
  ChartTooltip,
  Legend,
  TooltipRow,
  TooltipTitle,
  type TooltipState,
} from "./chart-primitives";

const NEUTRAL = "#3a4658";

interface RootDatum {
  name: "root";
  children: CountryEmission[];
}
type TreeDatum = RootDatum | CountryEmission;

const isLeaf = (d: TreeDatum): d is CountryEmission => "co2_mt" in d;

export function EmittersTreemap({ data }: { data: CountryEmission[] }) {
  const { palette, config } = useVizConfig();
  const [hover, setHover] = useState<{
    c: CountryEmission;
    x: number;
    y: number;
  } | null>(null);

  // Colour by region; biggest regions get the leading palette colours.
  const { colors, legendItems } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const c of data) {
      if (c.region === "Other") continue;
      totals.set(c.region, (totals.get(c.region) ?? 0) + c.co2_mt);
    }
    const ordered = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([r]) => r);
    const map = categoryColors(palette, ordered);
    map.set("Other", NEUTRAL);
    return {
      colors: map,
      legendItems: ordered.map((r) => ({ label: r, color: map.get(r)! })),
    };
  }, [palette, data]);

  const root = useMemo(
    () =>
      hierarchy<TreeDatum>({ name: "root", children: data })
        .sum((d) => (isLeaf(d) ? d.co2_mt : 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [data],
  );

  return (
    <div className="flex flex-col gap-5">
      <Legend items={legendItems} />
      <ChartFrame aspect={0.58} minHeight={420} maxHeight={620}>
        {({ width, height, inView }) => {
          const layout = treemap<TreeDatum>()
            .size([width, height])
            .paddingInner(3)
            .round(true);
          const leaves = layout(root).leaves();
          const animate = config.animate && inView;

          return (
            <>
              <svg width={width} height={height} role="img" aria-label="Treemap of CO₂ emissions by country">
                {leaves.map((leaf, i) => {
                  if (!isLeaf(leaf.data)) return null;
                  const c = leaf.data;
                  const w = (leaf.x1 ?? 0) - (leaf.x0 ?? 0);
                  const h = (leaf.y1 ?? 0) - (leaf.y0 ?? 0);
                  if (w <= 0 || h <= 0) return null;
                  const fill = colors.get(c.region) ?? NEUTRAL;
                  const showLabel = w > 52 && h > 30;
                  const showName = w > 78;
                  const isHover = hover?.c.country === c.country;

                  return (
                    <g
                      key={c.country}
                      transform={`translate(${leaf.x0},${leaf.y0})`}
                      onMouseEnter={(e) => {
                        const r =
                          e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                        setHover({
                          c,
                          x: e.clientX - r.left,
                          y: e.clientY - r.top,
                        });
                      }}
                      onMouseMove={(e) => {
                        const r =
                          e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                        setHover({
                          c,
                          x: e.clientX - r.left,
                          y: e.clientY - r.top,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        opacity: animate ? 1 : config.animate ? 0 : 1,
                        transform: `translate(${leaf.x0}px,${leaf.y0}px) scale(${
                          animate || !config.animate ? 1 : 0.94
                        })`,
                        transformOrigin: `${(leaf.x0 ?? 0) + w / 2}px ${
                          (leaf.y0 ?? 0) + h / 2
                        }px`,
                        transition: config.animate
                          ? `opacity 0.5s ease ${i * 11}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 11}ms`
                          : undefined,
                      }}
                    >
                      <rect
                        width={w}
                        height={h}
                        rx={4}
                        fill={fill}
                        fillOpacity={isHover ? 1 : 0.88}
                        stroke={isHover ? "white" : "transparent"}
                        strokeOpacity={0.6}
                        strokeWidth={1}
                      />
                      {showLabel && (
                        <text
                          x={9}
                          y={19}
                          className="pointer-events-none fill-black/85 text-[11px] font-semibold"
                        >
                          {showName ? c.country : c.iso3}
                        </text>
                      )}
                      {showLabel && config.showValues && h > 44 && (
                        <text
                          x={9}
                          y={34}
                          className="tabular pointer-events-none fill-black/65 text-[10px] font-medium"
                        >
                          {formatMtRaw(c.co2_mt)}
                        </text>
                      )}
                    </g>
                  );
                })}
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
                            label="Emissions"
                            swatch={colors.get(hover.c.region)}
                            value={formatMtRaw(hover.c.co2_mt)}
                          />
                          <TooltipRow
                            label="Share of world"
                            value={formatPercent(hover.c.share_global_pct)}
                          />
                          <TooltipRow
                            label="Per person"
                            value={formatPerCapita(hover.c.co2_per_capita_t)}
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
