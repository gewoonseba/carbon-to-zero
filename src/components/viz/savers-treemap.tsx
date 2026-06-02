"use client";

import { useMemo, useState } from "react";
import { hierarchy, treemap } from "d3";
import type { CustomerSaving } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatTonnes2, formatPercent, formatInt } from "@/lib/format";
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

const COUNTRY_NAMES: Record<string, string> = {
  NL: "Netherlands",
  BE: "Belgium",
};
const countryName = (c: string) => COUNTRY_NAMES[c] ?? c;

interface RootDatum {
  name: "root";
  children: CustomerSaving[];
}
type TreeDatum = RootDatum | CustomerSaving;

const isLeaf = (d: TreeDatum): d is CustomerSaving => "savedKg" in d;

export function SaversTreemap({ data }: { data: CustomerSaving[] }) {
  const { palette, config } = useVizConfig();
  const [hover, setHover] = useState<{
    c: CustomerSaving;
    x: number;
    y: number;
  } | null>(null);

  // Colour by country; the country saving the most carbon leads the palette.
  const { colors, legendItems } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const c of data) {
      totals.set(c.country, (totals.get(c.country) ?? 0) + c.savedKg);
    }
    const ordered = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const map = categoryColors(palette, ordered);
    return {
      colors: map,
      legendItems: ordered.map((k) => ({
        label: countryName(k),
        color: map.get(k)!,
      })),
    };
  }, [palette, data]);

  const root = useMemo(
    () =>
      hierarchy<TreeDatum>({ name: "root", children: data })
        .sum((d) => (isLeaf(d) ? d.savedKg : 0))
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
              <svg
                width={width}
                height={height}
                role="img"
                aria-label="Treemap of CO₂ saved by customer"
              >
                {leaves.map((leaf, i) => {
                  if (!isLeaf(leaf.data)) return null;
                  const c = leaf.data;
                  const w = (leaf.x1 ?? 0) - (leaf.x0 ?? 0);
                  const h = (leaf.y1 ?? 0) - (leaf.y0 ?? 0);
                  if (w <= 0 || h <= 0) return null;
                  const fill = colors.get(c.country) ?? NEUTRAL;
                  const showLabel = w > 70 && h > 34;
                  const isHover = hover?.c.id === c.id;

                  return (
                    <g
                      key={c.id}
                      transform={`translate(${leaf.x0},${leaf.y0})`}
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
                      style={{
                        opacity: animate ? 1 : config.animate ? 0 : 1,
                        transform: `translate(${leaf.x0}px,${leaf.y0}px) scale(${
                          animate || !config.animate ? 1 : 0.94
                        })`,
                        transformOrigin: `${(leaf.x0 ?? 0) + w / 2}px ${
                          (leaf.y0 ?? 0) + h / 2
                        }px`,
                        transition: config.animate
                          ? `opacity 0.5s ease ${i * 40}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms`
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
                          x={11}
                          y={22}
                          className="pointer-events-none fill-black/85 text-[12px] font-semibold"
                        >
                          {c.name}
                        </text>
                      )}
                      {showLabel && h > 50 && (
                        <text
                          x={11}
                          y={39}
                          className="pointer-events-none fill-black/65 text-[10px] font-medium"
                        >
                          {c.profileLabel}
                        </text>
                      )}
                      {showLabel && config.showValues && h > 70 && (
                        <text
                          x={11}
                          y={h - 12}
                          className="tabular pointer-events-none fill-black/80 text-[13px] font-semibold"
                        >
                          {formatTonnes2(c.savedTonnes)}
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
                          <TooltipTitle>{hover.c.name}</TooltipTitle>
                          <TooltipRow
                            label="CO₂ saved"
                            swatch={colors.get(hover.c.country)}
                            value={formatTonnes2(hover.c.savedTonnes)}
                          />
                          <TooltipRow
                            label="Emissions cut"
                            value={formatPercent(hover.c.pctReduction)}
                          />
                          <TooltipRow
                            label="Batteries steered"
                            value={formatInt(hover.c.nBatteries)}
                          />
                          <TooltipRow label="Site" value={hover.c.location} />
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
