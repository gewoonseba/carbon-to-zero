"use client";

import { useId, useMemo, useState } from "react";
import {
  scaleLinear,
  max,
  bisector,
  area,
  curveMonotoneX,
  line,
  stack,
  type SeriesPoint,
} from "d3";
import type { RegionTrend, RegionTrendRow } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatGt, formatMtRaw } from "@/lib/format";
import { useVizConfig } from "./viz-config";
import {
  ChartFrame,
  ChartTooltip,
  Legend,
  TooltipRow,
  TooltipTitle,
  type TooltipState,
} from "./chart-primitives";

const NEUTRAL = "#56657a";

const ANNOTATIONS = [
  { year: 1991, label: "Soviet collapse" },
  { year: 2008, label: "Financial crisis" },
  { year: 2015, label: "Paris Agreement" },
  { year: 2020, label: "COVID-19" },
];

const yearBisector = bisector<RegionTrendRow, number>((d) => d.year).center;

export function GlobalTrendArea({ data }: { data: RegionTrend }) {
  const { palette, config } = useVizConfig();
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const gradId = useId();

  const colors = useMemo(() => {
    const map = categoryColors(palette, data.regions);
    map.set("Rest of World", NEUTRAL);
    return map;
  }, [palette, data.regions]);

  const series = useMemo(
    () => stack<RegionTrendRow>().keys(data.regions)(data.rows),
    [data.regions, data.rows],
  );

  const legendItems = data.regions.map((r) => ({
    label: r,
    color: colors.get(r) ?? NEUTRAL,
  }));

  return (
    <div className="flex flex-col gap-5">
      <Legend
        items={legendItems}
        active={activeRegion}
        onHover={setActiveRegion}
      />
      <ChartFrame aspect={0.46} minHeight={300} maxHeight={520}>
        {({ width, height, inView }) => {
          const m = { top: 24, right: 18, bottom: 30, left: 44 };
          const innerW = width - m.left - m.right;
          const innerH = height - m.top - m.bottom;

          const years = data.rows.map((d) => d.year);
          const x = scaleLinear()
            .domain([years[0], years[years.length - 1]])
            .range([m.left, m.left + innerW]);

          const yMax =
            max(data.rows, (d) =>
              data.regions.reduce((s, r) => s + (d[r] ?? 0), 0),
            ) ?? 0;
          const y = scaleLinear()
            .domain([0, yMax])
            .nice()
            .range([m.top + innerH, m.top]);

          const areaGen = area<SeriesPoint<RegionTrendRow>>()
            .x((d) => x(d.data.year))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))
            .curve(curveMonotoneX);

          const totalLine = line<RegionTrendRow>()
            .x((d) => x(d.year))
            .y((d) =>
              y(data.regions.reduce((s, r) => s + (d[r] ?? 0), 0)),
            )
            .curve(curveMonotoneX);

          const yTicks = y.ticks(5);
          const xTicks = x.ticks(7).filter((t) => Number.isInteger(t));

          const hoverRow =
            hoverYear != null
              ? data.rows[yearBisector(data.rows, hoverYear)]
              : null;
          const animate = config.animate && inView;

          return (
            <>
              <svg
                width={width}
                height={height}
                className="overflow-visible"
                role="img"
                aria-label="Stacked area chart of CO₂ emissions by region, 1950 to 2022"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = e.clientX - rect.left;
                  setHoverYear(Math.round(x.invert(px)));
                }}
                onMouseLeave={() => setHoverYear(null)}
              >
                <defs>
                  {data.regions.map((r) => {
                    const c = colors.get(r) ?? NEUTRAL;
                    return (
                      <linearGradient
                        key={r}
                        id={`${gradId}-${r.replace(/\W/g, "")}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                      </linearGradient>
                    );
                  })}
                  <clipPath id={`${gradId}-wipe`}>
                    <rect
                      x={m.left}
                      y={0}
                      height={height}
                      width={0}
                      style={{
                        width: config.animate
                          ? animate
                            ? innerW
                            : 0
                          : innerW,
                        transition: config.animate
                          ? "width 1.3s cubic-bezier(0.16,1,0.3,1)"
                          : undefined,
                      }}
                    />
                  </clipPath>
                </defs>

                {/* horizontal gridlines */}
                {config.showGrid &&
                  yTicks.map((t) => (
                    <line
                      key={t}
                      x1={m.left}
                      x2={m.left + innerW}
                      y1={y(t)}
                      y2={y(t)}
                      className="stroke-white/[0.06]"
                    />
                  ))}

                {/* y labels (Gt) */}
                {yTicks.map((t) => (
                  <text
                    key={t}
                    x={m.left - 10}
                    y={y(t)}
                    dy="0.32em"
                    textAnchor="end"
                    className="tabular fill-muted-foreground text-[10px]"
                  >
                    {t === 0 ? "0" : formatGt(t)}
                  </text>
                ))}

                {/* stacked areas */}
                <g clipPath={`url(#${gradId}-wipe)`}>
                  {series.map((s) => {
                    const dimmed =
                      activeRegion != null && activeRegion !== s.key;
                    return (
                      <path
                        key={s.key}
                        d={areaGen(s) ?? undefined}
                        fill={`url(#${gradId}-${s.key.replace(/\W/g, "")})`}
                        stroke={colors.get(s.key) ?? NEUTRAL}
                        strokeWidth={0.75}
                        className="transition-opacity duration-300"
                        style={{ opacity: dimmed ? 0.18 : 1 }}
                        onMouseEnter={() => setActiveRegion(s.key)}
                        onMouseLeave={() => setActiveRegion(null)}
                      />
                    );
                  })}
                  {/* crisp total outline */}
                  <path
                    d={totalLine(data.rows) ?? undefined}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.25}
                    strokeWidth={1}
                  />
                </g>

                {/* x labels */}
                {xTicks.map((t) => (
                  <text
                    key={t}
                    x={x(t)}
                    y={m.top + innerH + 18}
                    textAnchor="middle"
                    className="tabular fill-muted-foreground text-[10px]"
                  >
                    {t}
                  </text>
                ))}

                {/* annotations */}
                {config.showAnnotations &&
                  ANNOTATIONS.filter(
                    (a) => a.year >= years[0] && a.year <= years[years.length - 1],
                  ).map((a, i) => (
                    <g key={a.year} className="pointer-events-none">
                      <line
                        x1={x(a.year)}
                        x2={x(a.year)}
                        y1={m.top}
                        y2={m.top + innerH}
                        className="stroke-white/20"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={x(a.year)}
                        y={m.top - 9 + (i % 2) * 12}
                        textAnchor="middle"
                        className="fill-foreground/70 text-[10px] font-medium"
                      >
                        {a.label}
                      </text>
                    </g>
                  ))}

                {/* hover crosshair */}
                {hoverRow && (
                  <line
                    x1={x(hoverRow.year)}
                    x2={x(hoverRow.year)}
                    y1={m.top}
                    y2={m.top + innerH}
                    stroke={palette.accent}
                    strokeWidth={1}
                    className="pointer-events-none"
                  />
                )}
              </svg>

              {hoverRow && (
                <ChartTooltip
                  containerWidth={width}
                  tooltip={
                    {
                      x: x(hoverRow.year),
                      y: m.top + innerH * 0.32,
                      content: (
                        <div className="flex flex-col gap-1">
                          <TooltipTitle>{hoverRow.year}</TooltipTitle>
                          {[...data.regions]
                            .sort(
                              (a, b) =>
                                (hoverRow[b] ?? 0) - (hoverRow[a] ?? 0),
                            )
                            .slice(0, 4)
                            .map((r) => (
                              <TooltipRow
                                key={r}
                                label={r}
                                swatch={colors.get(r)}
                                value={formatMtRaw(hoverRow[r] ?? 0)}
                              />
                            ))}
                          <div className="mt-1 border-t border-white/10 pt-1">
                            <TooltipRow
                              label="World total"
                              value={formatGt(
                                data.regions.reduce(
                                  (s, r) => s + (hoverRow[r] ?? 0),
                                  0,
                                ),
                              )}
                            />
                          </div>
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
