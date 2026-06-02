"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { scaleLinear, max, area, line, curveMonotoneX } from "d3";
import type { RegionTrend } from "@/lib/types";
import { useVizConfig } from "./viz-config";

const W = 1200;
const H = 420;

/**
 * The faint emissions silhouette behind the hero. Uses a fixed viewBox so it
 * scales fluidly, with the top line drawing itself in on mount.
 */
export function HeroBackdrop({ data }: { data: RegionTrend }) {
  const { palette, config } = useVizConfig();
  const gradId = useId();
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { areaPath, linePath } = useMemo(() => {
    const totals = data.rows.map((d) => ({
      year: d.year,
      total: data.regions.reduce((s, r) => s + (d[r] ?? 0), 0),
    }));
    const x = scaleLinear()
      .domain([totals[0].year, totals[totals.length - 1].year])
      .range([0, W]);
    const y = scaleLinear()
      .domain([0, max(totals, (d) => d.total) ?? 0])
      .range([H, H * 0.18]);
    const a = area<(typeof totals)[number]>()
      .x((d) => x(d.year))
      .y0(H)
      .y1((d) => y(d.total))
      .curve(curveMonotoneX);
    const l = line<(typeof totals)[number]>()
      .x((d) => x(d.year))
      .y((d) => y(d.total))
      .curve(curveMonotoneX);
    return { areaPath: a(totals) ?? "", linePath: l(totals) ?? "" };
  }, [data]);

  const animate = config.animate;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className="size-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gradId}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.accent} stopOpacity={0.26} />
          <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${gradId}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity={0} />
          <stop offset="22%" stopColor="white" stopOpacity={1} />
          <stop offset="100%" stopColor="white" stopOpacity={1} />
        </linearGradient>
        <mask id={`${gradId}-mask`}>
          <rect width={W} height={H} fill={`url(#${gradId}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${gradId}-mask)`}>
        <path d={areaPath} fill={`url(#${gradId}-fill)`} />
        <path
          d={linePath}
          fill="none"
          stroke={palette.accent}
          strokeWidth={2}
          strokeOpacity={0.55}
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: animate ? (drawn ? 0 : 1) : 0,
            transition: animate ? "stroke-dashoffset 2.4s ease-out" : undefined,
          }}
        />
      </g>
    </svg>
  );
}
