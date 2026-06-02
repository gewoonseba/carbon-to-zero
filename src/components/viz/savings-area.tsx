"use client";

import { useId, useMemo, useState } from "react";
import {
  scaleTime,
  scaleLinear,
  max,
  bisector,
  area,
  curveMonotoneX,
  line,
  stack,
  timeFormat,
  type SeriesPoint,
} from "d3";
import type { SavingsTrend, SavingsTrendRow } from "@/lib/types";
import { categoryColors } from "@/lib/palettes";
import { formatKg, formatKgAsTonnes } from "@/lib/format";
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

export interface SavingsAnnotation {
  date: string;
  label: string;
}

const tBisector = bisector<SavingsTrendRow, number>((d) => d.t as number).center;
const fmtMonth = timeFormat("%b");
const fmtFull = timeFormat("%-d %b");

export function SavingsArea({
  data,
  annotations = [],
}: {
  data: SavingsTrend;
  annotations?: SavingsAnnotation[];
}) {
  const { palette, config } = useVizConfig();
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<string | null>(null);
  const gradId = useId();

  const colors = useMemo(
    () => categoryColors(palette, data.customers),
    [palette, data.customers],
  );

  const series = useMemo(
    () => stack<SavingsTrendRow>().keys(data.customers)(data.rows),
    [data.customers, data.rows],
  );

  const legendItems = data.customers.map((c) => ({
    label: c,
    color: colors.get(c) ?? NEUTRAL,
  }));

  const total = (d: SavingsTrendRow) =>
    data.customers.reduce((s, c) => s + ((d[c] as number) ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <Legend
        items={legendItems}
        active={activeCustomer}
        onHover={setActiveCustomer}
      />
      <ChartFrame aspect={0.46} minHeight={300} maxHeight={520}>
        {({ width, height, inView }) => {
          const m = { top: 24, right: 18, bottom: 30, left: 52 };
          const innerW = width - m.left - m.right;
          const innerH = height - m.top - m.bottom;

          const ts = data.rows.map((d) => d.t as number);
          const x = scaleTime()
            .domain([ts[0], ts[ts.length - 1]])
            .range([m.left, m.left + innerW]);

          const yMax = max(data.rows, total) ?? 0;
          const y = scaleLinear()
            .domain([0, yMax])
            .nice()
            .range([m.top + innerH, m.top]);

          const areaGen = area<SeriesPoint<SavingsTrendRow>>()
            .x((d) => x(d.data.t as number))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))
            .curve(curveMonotoneX);

          const totalLine = line<SavingsTrendRow>()
            .x((d) => x(d.t as number))
            .y((d) => y(total(d)))
            .curve(curveMonotoneX);

          const yTicks = y.ticks(5);
          const xTicks = x.ticks(6);

          const hoverRow =
            hoverT != null ? data.rows[tBisector(data.rows, hoverT)] : null;
          const animate = config.animate && inView;

          return (
            <>
              <svg
                width={width}
                height={height}
                className="overflow-visible"
                role="img"
                aria-label="Stacked area chart of cumulative CO₂ saved by customer"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = e.clientX - rect.left;
                  setHoverT(+x.invert(px));
                }}
                onMouseLeave={() => setHoverT(null)}
              >
                <defs>
                  {data.customers.map((c) => {
                    const col = colors.get(c) ?? NEUTRAL;
                    return (
                      <linearGradient
                        key={c}
                        id={`${gradId}-${c.replace(/\W/g, "")}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={col} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={col} stopOpacity={0.55} />
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
                        width: config.animate ? (animate ? innerW : 0) : innerW,
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

                {/* y labels (tonnes) */}
                {yTicks.map((t) => (
                  <text
                    key={t}
                    x={m.left - 10}
                    y={y(t)}
                    dy="0.32em"
                    textAnchor="end"
                    className="tabular fill-muted-foreground text-[10px]"
                  >
                    {t === 0 ? "0" : formatKgAsTonnes(t)}
                  </text>
                ))}

                {/* stacked areas */}
                <g clipPath={`url(#${gradId}-wipe)`}>
                  {series.map((s) => {
                    const dimmed =
                      activeCustomer != null && activeCustomer !== s.key;
                    return (
                      <path
                        key={s.key}
                        d={areaGen(s) ?? undefined}
                        fill={`url(#${gradId}-${s.key.replace(/\W/g, "")})`}
                        stroke={colors.get(s.key) ?? NEUTRAL}
                        strokeWidth={0.75}
                        className="transition-opacity duration-300"
                        style={{ opacity: dimmed ? 0.18 : 1 }}
                        onMouseEnter={() => setActiveCustomer(s.key)}
                        onMouseLeave={() => setActiveCustomer(null)}
                      />
                    );
                  })}
                  {/* crisp running-total outline */}
                  <path
                    d={totalLine(data.rows) ?? undefined}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.25}
                    strokeWidth={1}
                  />
                </g>

                {/* x labels (months) */}
                {xTicks.map((t) => (
                  <text
                    key={+t}
                    x={x(t)}
                    y={m.top + innerH + 18}
                    textAnchor="middle"
                    className="tabular fill-muted-foreground text-[10px]"
                  >
                    {fmtMonth(t)}
                  </text>
                ))}

                {/* onboarding annotations */}
                {config.showAnnotations &&
                  annotations.map((a, i) => {
                    const at = new Date(`${a.date}T00:00:00Z`).getTime();
                    if (at < ts[0] || at > ts[ts.length - 1]) return null;
                    return (
                      <g key={a.date + a.label} className="pointer-events-none">
                        <line
                          x1={x(at)}
                          x2={x(at)}
                          y1={m.top}
                          y2={m.top + innerH}
                          className="stroke-white/20"
                          strokeDasharray="3 4"
                        />
                        <text
                          x={x(at)}
                          y={m.top - 9 + (i % 2) * 12}
                          textAnchor="middle"
                          className="fill-foreground/70 text-[10px] font-medium"
                        >
                          {a.label}
                        </text>
                      </g>
                    );
                  })}

                {/* hover crosshair */}
                {hoverRow && (
                  <line
                    x1={x(hoverRow.t as number)}
                    x2={x(hoverRow.t as number)}
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
                      x: x(hoverRow.t as number),
                      y: m.top + innerH * 0.32,
                      content: (
                        <div className="flex flex-col gap-1">
                          <TooltipTitle>
                            {fmtFull(new Date(hoverRow.t as number))}
                          </TooltipTitle>
                          {[...data.customers]
                            .sort(
                              (a, b) =>
                                ((hoverRow[b] as number) ?? 0) -
                                ((hoverRow[a] as number) ?? 0),
                            )
                            .slice(0, 4)
                            .map((c) => (
                              <TooltipRow
                                key={c}
                                label={c}
                                swatch={colors.get(c)}
                                value={formatKg((hoverRow[c] as number) ?? 0)}
                              />
                            ))}
                          <div className="mt-1 border-t border-white/10 pt-1">
                            <TooltipRow
                              label="Fleet, cumulative"
                              value={formatKg(total(hoverRow))}
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
